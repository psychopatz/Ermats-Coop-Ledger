import { NextResponse } from 'next/server';
import { appendRow } from '@/lib/googleSheets';
import { normalizeReferenceCode, PAYMENT_METHODS } from '@/lib/domain/payments';
import { generatePaymentId } from '@/lib/ids';
import { writeAuditLog } from '@/lib/auditLog';
import { listLoans, listPayments } from '@/lib/repositories/ledgerRepository';
import { getMemberSession } from '@/lib/session';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(request) {
  try {
    const memberSession = await getMemberSession();
    if (!memberSession) {
      return NextResponse.json({ error: 'Member authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { loan_id, amount_received, payment_date, payment_method, reference_code } = body;

    if (!loan_id || amount_received === undefined || !payment_date || !payment_method) {
      return NextResponse.json(
        {
          error: 'Required fields missing. Provide: loan_id, amount_received, payment_date, payment_method.',
        },
        { status: 400 }
      );
    }

    const amount = parseFloat(amount_received);
    if (Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'amount_received must be a valid positive number.' },
        { status: 400 }
      );
    }

    const normalizedMethod = String(payment_method).trim().toLowerCase();
    if (!PAYMENT_METHODS.includes(normalizedMethod)) {
      return NextResponse.json(
        { error: `payment_method must be one of: ${PAYMENT_METHODS.join(', ')}.` },
        { status: 400 }
      );
    }

    const normalizedReferenceCode = normalizedMethod === 'gcash'
      ? normalizeReferenceCode(reference_code)
      : '';
    if (normalizedMethod === 'gcash' && !normalizedReferenceCode) {
      return NextResponse.json(
        { error: 'reference_code is required for GCash payments.' },
        { status: 400 }
      );
    }

    const [loans, payments] = await Promise.all([listLoans(), listPayments()]);
    const loan = loans.find((entry) => entry.loan_id === loan_id);

    if (!loan || loan.member_id !== memberSession.member_id) {
      return NextResponse.json(
        { error: 'You can only submit payments for your own active loans.' },
        { status: 403 }
      );
    }

    if (loan.status === 'paid' || parseFloat(loan.balance) <= 0) {
      return NextResponse.json(
        { error: 'This loan has already been fully paid and closed.' },
        { status: 400 }
      );
    }

    const payment_id = generatePaymentId(payments);
    const now = new Date().toISOString();
    const newPayment = {
      payment_id,
      loan_id,
      member_id: memberSession.member_id,
      payment_date,
      amount_received: amount,
      received_by: '',
      status: 'pending_approval',
      created_at: now,
      updated_at: now,
      payment_method: normalizedMethod,
      reference_code: normalizedReferenceCode,
    };

    await appendRow('Payments', newPayment);

    await writeAuditLog({
      actorEmail: memberSession.email,
      action: 'SUBMIT_MEMBER_PAYMENT',
      entityType: 'Payments',
      entityId: payment_id,
      details: {
        loan_id,
        amount_received: amount,
        payment_method: normalizedMethod,
        reference_code: normalizedReferenceCode,
      },
    });

    const { _rowNumber, ...sanitizedPayment } = newPayment;
    return NextResponse.json(sanitizedPayment, { status: 201 });
  } catch (error) {
    console.error('POST /api/member/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to submit payment: ' + error.message },
      { status: 500 }
    );
  }
}