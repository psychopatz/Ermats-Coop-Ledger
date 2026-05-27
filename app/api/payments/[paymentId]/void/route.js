// app/api/payments/[paymentId]/void/route.js
import { NextResponse } from 'next/server';
import { getRows, rowsToObjects, updateRow } from '@/lib/googleSheets';
import { writeAuditLog } from '@/lib/auditLog';

export async function PATCH(request, { params }) {
  try {
    const { paymentId } = await params;
    const body = await request.json();
    const { void_reason, actor_email } = body;

    // Validate inputs
    if (!void_reason || !actor_email) {
      return NextResponse.json(
        { error: 'Required fields missing. Provide: void_reason, actor_email.' },
        { status: 400 }
      );
    }

    // 1. Fetch payment
    const rawPayments = await getRows('Payments');
    const payments = rowsToObjects(rawPayments);
    const existingPayment = payments.find((p) => p.payment_id === paymentId);

    if (!existingPayment) {
      return NextResponse.json(
        { error: `Payment with ID "${paymentId}" not found.` },
        { status: 404 }
      );
    }

    if (existingPayment.status === 'voided') {
      return NextResponse.json(
        { error: 'This payment is already voided.' },
        { status: 400 }
      );
    }

    // 2. Fetch associated loan
    const rawLoans = await getRows('Loans');
    const loans = rowsToObjects(rawLoans);
    const loan = loans.find((l) => l.loan_id === existingPayment.loan_id);

    if (!loan) {
      return NextResponse.json(
        { error: `Associated loan with ID "${existingPayment.loan_id}" not found.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 3. Mark payment as voided
    const updatedPayment = {
      ...existingPayment,
      status: 'voided',
      updated_at: now,
    };

    // 4. Recalculate loan balance (add voided amount back)
    const amountReversed = parseFloat(existingPayment.amount_received);
    const currentBalance = parseFloat(loan.balance);
    const newBalance = currentBalance + amountReversed;

    // Revert status to active if it was fully paid or if balance > 0
    let loanStatus = loan.status;
    if (loanStatus === 'paid' || newBalance > 0) {
      loanStatus = 'active';
    }

    const updatedLoan = {
      ...loan,
      balance: newBalance,
      status: loanStatus,
      updated_at: now,
    };

    // 5. Commit updates
    await updateRow('Payments', existingPayment._rowNumber, updatedPayment);
    await updateRow('Loans', loan._rowNumber, updatedLoan);

    // 6. Write audit logs
    await writeAuditLog({
      actorEmail: actor_email,
      action: 'VOID_PAYMENT',
      entityType: 'Payments',
      entityId: paymentId,
      details: {
        loan_id: existingPayment.loan_id,
        amount_reversed: amountReversed,
        void_reason,
      },
    });

    await writeAuditLog({
      actorEmail: actor_email,
      action: 'REVERT_LOAN_BALANCE_VOID',
      entityType: 'Loans',
      entityId: existingPayment.loan_id,
      details: {
        payment_id: paymentId,
        previous_balance: currentBalance,
        new_balance: newBalance,
        status: loanStatus,
      },
    });

    const { _rowNumber, ...sanitizedPayment } = updatedPayment;
    return NextResponse.json(sanitizedPayment);
  } catch (error) {
    console.error('PATCH /api/payments/[paymentId]/void error:', error);
    return NextResponse.json(
      { error: 'Failed to void payment: ' + error.message },
      { status: 500 }
    );
  }
}
