// app/api/payments/[paymentId]/void/route.js
import { NextResponse } from 'next/server';
import { updateRow } from '@/lib/googleSheets';
import { writeAuditLog } from '@/lib/auditLog';
import { isSettledPaymentStatus } from '@/lib/domain/payments';
import { listLoans, listPayments } from '@/lib/repositories/ledgerRepository';
import { getAdminSession } from '@/lib/session';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function PATCH(request, { params }) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const { paymentId } = await params;
    const body = await request.json();
    const { void_reason } = body;

    // Validate inputs
    if (!void_reason) {
      return NextResponse.json(
        { error: 'Required fields missing. Provide: void_reason.' },
        { status: 400 }
      );
    }

    // 1. Fetch payment
    const [payments, loans] = await Promise.all([listPayments(), listLoans()]);
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

    const amountReversed = parseFloat(existingPayment.amount_received);
    const currentBalance = parseFloat(loan.balance);
    let updatedLoan = null;
    let newBalance = currentBalance;
    let loanStatus = loan.status;

    if (isSettledPaymentStatus(existingPayment.status)) {
      newBalance = currentBalance + amountReversed;

      if (loanStatus === 'paid' || newBalance > 0) {
        loanStatus = 'active';
      }

      updatedLoan = {
        ...loan,
        balance: newBalance,
        status: loanStatus,
        updated_at: now,
      };
    }

    // 5. Commit updates
    await updateRow('Payments', existingPayment._rowNumber, updatedPayment);
    if (updatedLoan) {
      await updateRow('Loans', loan._rowNumber, updatedLoan);
    }

    // 6. Write audit logs
    await writeAuditLog({
      actorEmail: adminSession.email,
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
      actorEmail: adminSession.email,
      action: 'REVERT_LOAN_BALANCE_VOID',
      entityType: 'Loans',
      entityId: existingPayment.loan_id,
      details: {
        payment_id: paymentId,
        previous_balance: currentBalance,
        new_balance: newBalance,
        status: loanStatus,
        balance_updated: Boolean(updatedLoan),
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
