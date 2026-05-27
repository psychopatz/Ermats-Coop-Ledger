import { NextResponse } from 'next/server';
import { appendRow } from '@/lib/googleSheets';
import { writeAuditLog } from '@/lib/auditLog';
import { generateLoanRequestId } from '@/lib/ids';
import { listLoanRequests, listLoans } from '@/lib/repositories/ledgerRepository';
import { getMemberSession } from '@/lib/session';

function hasActiveLoan(loans, memberId) {
  return loans.some((loan) => {
    if (loan.member_id !== memberId) {
      return false;
    }

    return parseFloat(loan.balance) > 0 && String(loan.status || '').toLowerCase() !== 'paid';
  });
}

export async function POST(request) {
  try {
    const memberSession = await getMemberSession();
    if (!memberSession) {
      return NextResponse.json({ error: 'Member authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const requestedAmount = Number.parseFloat(body.requested_amount);
    const requestedTermMonths = Number.parseInt(body.requested_term_months, 10);
    const preferredReleaseDate = String(body.preferred_release_date || '').trim();
    const purpose = String(body.purpose || '').trim();

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || !Number.isInteger(requestedTermMonths) || requestedTermMonths <= 0) {
      return NextResponse.json(
        { error: 'requested_amount and requested_term_months must be valid positive values.' },
        { status: 400 }
      );
    }

    if (!preferredReleaseDate) {
      return NextResponse.json(
        { error: 'preferred_release_date is required.' },
        { status: 400 }
      );
    }

    const [loans, loanRequests] = await Promise.all([listLoans(), listLoanRequests()]);

    if (hasActiveLoan(loans, memberSession.member_id)) {
      return NextResponse.json(
        { error: 'You cannot request a new loan while an existing loan still has an unpaid balance.' },
        { status: 400 }
      );
    }

    if (loanRequests.some((entry) => entry.member_id === memberSession.member_id && entry.status === 'pending_approval')) {
      return NextResponse.json(
        { error: 'You already have a pending loan request awaiting admin review.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const loanRequest = {
      request_id: generateLoanRequestId(loanRequests),
      member_id: memberSession.member_id,
      requested_amount: requestedAmount,
      requested_term_months: requestedTermMonths,
      preferred_release_date: preferredReleaseDate,
      purpose,
      status: 'pending_approval',
      reviewed_by: '',
      admin_notes: '',
      approved_interest_rate: '',
      approved_loan_id: '',
      created_at: now,
      updated_at: now,
    };

    await appendRow('Loan_Requests', loanRequest);

    await writeAuditLog({
      actorEmail: memberSession.email,
      action: 'SUBMIT_LOAN_REQUEST',
      entityType: 'Loan_Requests',
      entityId: loanRequest.request_id,
      details: {
        requested_amount: requestedAmount,
        requested_term_months: requestedTermMonths,
        preferred_release_date: preferredReleaseDate,
        purpose,
      },
    });

    return NextResponse.json(loanRequest, { status: 201 });
  } catch (error) {
    console.error('POST /api/member/loan-requests error:', error);
    return NextResponse.json(
      { error: 'Failed to submit loan request: ' + error.message },
      { status: 500 }
    );
  }
}