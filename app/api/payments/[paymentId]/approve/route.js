import { NextResponse } from 'next/server';
import { updateRow } from '@/lib/googleSheets';
import { isSettledPaymentStatus } from '@/lib/domain/payments';
import { writeAuditLog } from '@/lib/auditLog';
import { listLoans, listPayments } from '@/lib/repositories/ledgerRepository';
import { getAdminSession } from '@/lib/session';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function PATCH(_request, { params }) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const { paymentId } = await params;
    const [payments, loans] = await Promise.all([listPayments(), listLoans()]);
    const existingPayment = payments.find((payment) => payment.payment_id === paymentId);

    if (!existingPayment) {
      return NextResponse.json(
        { error: `Payment with ID "${paymentId}" not found.` },
        { status: 404 }
      );
    }

    if (existingPayment.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Only pending member payments can be approved.' },
        { status: 400 }
      );
    }

    const loan = loans.find((entry) => entry.loan_id === existingPayment.loan_id);
    if (!loan) {
      return NextResponse.json(
        { error: `Associated loan with ID "${existingPayment.loan_id}" not found.` },
        { status: 400 }
      );
    }

    if (loan.status === 'paid' || parseFloat(loan.balance) <= 0) {
      return NextResponse.json(
        { error: 'This loan is already closed and can no longer accept approved payments.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const amount = parseFloat(existingPayment.amount_received);
    const currentBalance = parseFloat(loan.balance);
    let newBalance = currentBalance - amount;
    let loanStatus = loan.status;

    if (newBalance <= 0) {
      newBalance = 0;
      loanStatus = 'paid';
    }

    const updatedPayment = {
      ...existingPayment,
      status: 'approved',
      received_by: adminSession.email,
      updated_at: now,
    };
    const updatedLoan = {
      ...loan,
      balance: newBalance,
      status: loanStatus,
      updated_at: now,
    };

    await updateRow('Payments', existingPayment._rowNumber, updatedPayment);
    await updateRow('Loans', loan._rowNumber, updatedLoan);

    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'APPROVE_MEMBER_PAYMENT',
      entityType: 'Payments',
      entityId: paymentId,
      details: {
        loan_id: existingPayment.loan_id,
        member_id: existingPayment.member_id,
        amount_received: amount,
        payment_method: existingPayment.payment_method,
        reference_code: existingPayment.reference_code,
      },
    });

    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'UPDATE_LOAN_BALANCE',
      entityType: 'Loans',
      entityId: existingPayment.loan_id,
      details: {
        payment_id: paymentId,
        previous_balance: currentBalance,
        new_balance: newBalance,
        status: loanStatus,
        approved_from_pending: !isSettledPaymentStatus(existingPayment.status),
      },
    });

    const { _rowNumber, ...sanitizedPayment } = updatedPayment;
    return NextResponse.json(sanitizedPayment);
  } catch (error) {
    console.error('PATCH /api/payments/[paymentId]/approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve payment: ' + error.message },
      { status: 500 }
    );
  }
}