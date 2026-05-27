// app/api/payments/route.js
import { NextResponse } from 'next/server';
import { appendRow, updateRow } from '@/lib/googleSheets';
import {
  enrichLoans,
  enrichPayments,
  isSettledPaymentStatus,
  normalizeReferenceCode,
  PAYMENT_METHODS,
} from '@/lib/domain/payments';
import { generatePaymentId } from '@/lib/ids';
import { writeAuditLog } from '@/lib/auditLog';
import { listLoans, listMembers, listPayments } from '@/lib/repositories/ledgerRepository';
import { getAdminSession, getSession } from '@/lib/session';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedMemberId = searchParams.get('member_id');
    const loanId = searchParams.get('loan_id');

    if (session.role === 'member' && requestedMemberId && requestedMemberId !== session.member_id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const memberId = session.role === 'member' ? session.member_id : requestedMemberId;

    const [loans, payments] = await Promise.all([listLoans(), listPayments()]);
    const enrichedLoans = enrichLoans(loans, payments);
    const enrichedPayments = enrichPayments(payments, enrichedLoans);

    let filtered = enrichedPayments;
    if (memberId) {
      filtered = filtered.filter((payment) => payment.member_id === memberId);
    }
    if (loanId) {
      filtered = filtered.filter((payment) => payment.loan_id === loanId);
    }

    // Sanitize response by removing internal _rowNumber
    const responseData = filtered.map(({ _rowNumber, ...rest }) => rest);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payments: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { loan_id, member_id, amount_received, payment_date, payment_method, reference_code } = body;

    // Validate presence of required inputs
    if (
      !loan_id ||
      !member_id ||
      amount_received === undefined ||
      !payment_date ||
      !payment_method
    ) {
      return NextResponse.json(
        {
          error: 'Required fields missing. Provide: loan_id, member_id, amount_received, payment_date, payment_method.',
        },
        { status: 400 }
      );
    }

    const amount = parseFloat(amount_received);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'amount_received must be a valid positive number.' },
        { status: 400 }
      );
    }

    const normalizedMethod = String(payment_method).trim().toLowerCase();
    const normalizedReferenceCode = normalizedMethod === 'gcash'
      ? normalizeReferenceCode(reference_code)
      : '';
    if (!PAYMENT_METHODS.includes(normalizedMethod)) {
      return NextResponse.json(
        { error: `payment_method must be one of: ${PAYMENT_METHODS.join(', ')}.` },
        { status: 400 }
      );
    }
    if (normalizedMethod === 'gcash' && !normalizedReferenceCode) {
      return NextResponse.json(
        { error: 'reference_code is required for GCash payments.' },
        { status: 400 }
      );
    }

    const [members, loans, payments] = await Promise.all([listMembers(), listLoans(), listPayments()]);
    const member = members.find((m) => m.member_id === member_id);
    if (!member) {
      return NextResponse.json(
        { error: `Associated member with ID "${member_id}" does not exist.` },
        { status: 400 }
      );
    }

    const loan = loans.find((l) => l.loan_id === loan_id);

    if (!loan) {
      return NextResponse.json(
        { error: `Associated loan with ID "${loan_id}" does not exist.` },
        { status: 400 }
      );
    }
    if (loan.member_id !== member_id) {
      return NextResponse.json(
        { error: `Associated loan with ID "${loan_id}" does not belong to member "${member_id}".` },
        { status: 400 }
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
      member_id,
      payment_date,
      amount_received: amount,
      received_by: adminSession.email,
      status: 'approved',
      created_at: now,
      updated_at: now,
      payment_method: normalizedMethod,
      reference_code: normalizedReferenceCode,
    };

    // Calculate new balance
    const currentBalance = parseFloat(loan.balance);
    let newBalance = currentBalance - amount;
    let loanStatus = loan.status;

    if (newBalance <= 0) {
      newBalance = 0;
      loanStatus = 'paid';
    }

    const updatedLoan = {
      ...loan,
      balance: newBalance,
      status: loanStatus,
      updated_at: now,
    };

    // Commit writes
    await appendRow('Payments', newPayment);
    await updateRow('Loans', loan._rowNumber, updatedLoan);

    // Audit logging for transaction
    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'RECORD_PAYMENT',
      entityType: 'Payments',
      entityId: payment_id,
      details: {
        loan_id,
        member_id,
        amount_received: amount,
        payment_method: normalizedMethod,
        reference_code: normalizedReferenceCode,
      },
    });

    // Audit logging for loan state change
    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'UPDATE_LOAN_BALANCE',
      entityType: 'Loans',
      entityId: loan_id,
      details: {
        payment_id,
        previous_balance: currentBalance,
        new_balance: newBalance,
        status: loanStatus,
      },
    });

    const { _rowNumber, ...sanitizedPayment } = newPayment;
    return NextResponse.json(sanitizedPayment, { status: 201 });
  } catch (error) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment: ' + error.message },
      { status: 500 }
    );
  }
}
