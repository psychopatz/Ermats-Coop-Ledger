// app/api/loans/[loanId]/route.js
import { NextResponse } from 'next/server';
import { updateRow } from '@/lib/googleSheets';
import { enrichLoans } from '@/lib/domain/payments';
import { writeAuditLog } from '@/lib/auditLog';
import { listLoans, listPayments } from '@/lib/repositories/ledgerRepository';
import { getAdminSession, getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { loanId } = await params;
    const [loans, payments] = await Promise.all([listLoans(), listPayments()]);
    const enrichedLoans = enrichLoans(loans, payments);

    const loan = enrichedLoans.find((l) => l.loan_id === loanId);
    if (!loan) {
      return NextResponse.json(
        { error: `Loan with ID "${loanId}" not found.` },
        { status: 404 }
      );
    }

    if (session.role === 'member' && loan.member_id !== session.member_id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { _rowNumber, ...sanitizedLoan } = loan;
    return NextResponse.json(sanitizedLoan);
  } catch (error) {
    console.error('GET /api/loans/[loanId] error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve loan: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const { loanId } = await params;
    const body = await request.json();

    // Prevent changing loan_id
    if (body.loan_id && body.loan_id !== loanId) {
      return NextResponse.json(
        { error: 'Modifying the loan_id is not allowed.' },
        { status: 400 }
      );
    }

    const loans = await listLoans();

    const existingLoan = loans.find((l) => l.loan_id === loanId);
    if (!existingLoan) {
      return NextResponse.json(
        { error: `Loan with ID "${loanId}" not found.` },
        { status: 404 }
      );
    }

    // Check if term-sensitive fields are being changed
    const principalChanged =
      body.principal_amount !== undefined &&
      parseFloat(body.principal_amount) !== parseFloat(existingLoan.principal_amount);
    const rateChanged =
      body.interest_rate !== undefined &&
      parseFloat(body.interest_rate) !== parseFloat(existingLoan.interest_rate);
    const termChanged =
      body.term_months !== undefined &&
      parseInt(body.term_months, 10) !== parseInt(existingLoan.term_months, 10);

    const isRecalculationNeeded = principalChanged || rateChanged || termChanged;

    let updatedLoan = {
      ...existingLoan,
      ...body,
      loan_id: loanId,
      updated_at: new Date().toISOString(),
    };

    if (isRecalculationNeeded) {
      // Verify if any active (non-voided) payments exist for this loan
      const payments = await listPayments();
      const activePayments = payments.filter(
        (p) => p.loan_id === loanId && p.status !== 'voided'
      );

      if (activePayments.length > 0) {
        return NextResponse.json(
          {
            error:
              'Cannot recalculate or modify principal, interest rate, or term. Active payments already exist for this loan.',
          },
          { status: 400 }
        );
      }

      // Perform flat rate recalculation
      const principal = parseFloat(
        body.principal_amount !== undefined ? body.principal_amount : existingLoan.principal_amount
      );
      const rate = parseFloat(
        body.interest_rate !== undefined ? body.interest_rate : existingLoan.interest_rate
      );
      const term = parseInt(
        body.term_months !== undefined ? body.term_months : existingLoan.term_months,
        10
      );

      if (isNaN(principal) || isNaN(rate) || isNaN(term) || principal <= 0 || rate < 0 || term <= 0) {
        return NextResponse.json(
          { error: 'Invalid numeric inputs provided for loan term updates.' },
          { status: 400 }
        );
      }

      const total_interest = principal * rate * term;
      const total_payable = principal + total_interest;

      updatedLoan.principal_amount = principal;
      updatedLoan.interest_rate = rate;
      updatedLoan.term_months = term;
      updatedLoan.total_payable = total_payable;
      updatedLoan.balance = total_payable; // Re-align balance since there are no active payments
    }

    await updateRow('Loans', existingLoan._rowNumber, updatedLoan);

    // Write audit log
    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'UPDATE_LOAN',
      entityType: 'Loans',
      entityId: loanId,
      details: { updatedFields: Object.keys(body).filter((k) => k !== '_rowNumber') },
    });

    const { _rowNumber, ...sanitizedLoan } = updatedLoan;
    return NextResponse.json(sanitizedLoan);
  } catch (error) {
    console.error('PATCH /api/loans/[loanId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update loan: ' + error.message },
      { status: 500 }
    );
  }
}
