// app/api/loans/[loanId]/route.js
import { NextResponse } from 'next/server';
import { getRows, rowsToObjects, updateRow } from '@/lib/googleSheets';
import { writeAuditLog } from '@/lib/auditLog';

export async function GET(request, { params }) {
  try {
    const { loanId } = await params;
    const rawRows = await getRows('Loans');
    const loans = rowsToObjects(rawRows);

    const loan = loans.find((l) => l.loan_id === loanId);
    if (!loan) {
      return NextResponse.json(
        { error: `Loan with ID "${loanId}" not found.` },
        { status: 404 }
      );
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
    const { loanId } = await params;
    const body = await request.json();

    // Prevent changing loan_id
    if (body.loan_id && body.loan_id !== loanId) {
      return NextResponse.json(
        { error: 'Modifying the loan_id is not allowed.' },
        { status: 400 }
      );
    }

    const rawRows = await getRows('Loans');
    const loans = rowsToObjects(rawRows);

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
      const rawPayments = await getRows('Payments');
      const payments = rowsToObjects(rawPayments);
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
      actorEmail: 'admin@test.com',
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
