import { NextResponse } from 'next/server';
import { appendRow, updateRow } from '@/lib/googleSheets';
import { writeAuditLog } from '@/lib/auditLog';
import { generateLoanId } from '@/lib/ids';
import { listLoanRequests, listLoans, listMembers } from '@/lib/repositories/ledgerRepository';
import { getAdminSession } from '@/lib/session';

function hasActiveLoan(loans, memberId) {
  return loans.some((loan) => {
    if (loan.member_id !== memberId) {
      return false;
    }

    return parseFloat(loan.balance) > 0 && String(loan.status || '').toLowerCase() !== 'paid';
  });
}

export async function PATCH(request, { params }) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json().catch(() => ({}));
    const approvedInterestRate = body.approved_interest_rate === undefined ? 0.03 : Number.parseFloat(body.approved_interest_rate);
    const releaseDate = String(body.release_date || '').trim();
    const adminNotes = String(body.admin_notes || '').trim();

    if (!Number.isFinite(approvedInterestRate) || approvedInterestRate < 0) {
      return NextResponse.json(
        { error: 'approved_interest_rate must be a valid non-negative number.' },
        { status: 400 }
      );
    }

    const [loanRequests, loans, members] = await Promise.all([listLoanRequests(), listLoans(), listMembers()]);
    const loanRequest = loanRequests.find((entry) => entry.request_id === requestId);

    if (!loanRequest) {
      return NextResponse.json({ error: `Loan request with ID "${requestId}" not found.` }, { status: 404 });
    }

    if (loanRequest.status !== 'pending_approval') {
      return NextResponse.json({ error: 'Only pending loan requests can be approved.' }, { status: 400 });
    }

    const member = members.find((entry) => entry.member_id === loanRequest.member_id);
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'The requested member is missing or inactive.' }, { status: 400 });
    }

    if (hasActiveLoan(loans, loanRequest.member_id)) {
      return NextResponse.json(
        { error: 'This member already has an unpaid loan and cannot be approved for a new one yet.' },
        { status: 400 }
      );
    }

    const principalAmount = Number.parseFloat(loanRequest.requested_amount);
    const termMonths = Number.parseInt(loanRequest.requested_term_months, 10);
    const totalPayable = principalAmount + (principalAmount * approvedInterestRate * termMonths);
    const now = new Date().toISOString();
    const loanId = generateLoanId(loans);
    const approvedLoan = {
      loan_id: loanId,
      member_id: loanRequest.member_id,
      principal_amount: principalAmount,
      interest_rate: approvedInterestRate,
      term_months: termMonths,
      total_payable: totalPayable,
      balance: totalPayable,
      status: 'active',
      release_date: releaseDate || loanRequest.preferred_release_date || now.split('T')[0],
      created_at: now,
      updated_at: now,
    };
    const updatedRequest = {
      ...loanRequest,
      status: 'approved',
      reviewed_by: adminSession.email,
      admin_notes: adminNotes,
      approved_interest_rate: approvedInterestRate,
      approved_loan_id: loanId,
      updated_at: now,
    };

    await appendRow('Loans', approvedLoan);
    await updateRow('Loan_Requests', loanRequest._rowNumber, updatedRequest);

    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'APPROVE_LOAN_REQUEST',
      entityType: 'Loan_Requests',
      entityId: requestId,
      details: {
        member_id: loanRequest.member_id,
        approved_interest_rate: approvedInterestRate,
        approved_loan_id: loanId,
      },
    });

    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'CREATE_LOAN_FROM_REQUEST',
      entityType: 'Loans',
      entityId: loanId,
      details: {
        request_id: requestId,
        member_id: loanRequest.member_id,
        principal_amount: principalAmount,
        term_months: termMonths,
        total_payable: totalPayable,
      },
    });

    return NextResponse.json({ request: updatedRequest, loan: approvedLoan }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/loan-requests/[requestId]/approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve loan request: ' + error.message },
      { status: 500 }
    );
  }
}