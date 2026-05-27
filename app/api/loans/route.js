// app/api/loans/route.js
import { NextResponse } from 'next/server';
import { getRows, rowsToObjects, appendRow } from '@/lib/googleSheets';
import { generateLoanId } from '@/lib/ids';
import { writeAuditLog } from '@/lib/auditLog';
import { getAdminSession, getSession } from '@/lib/session';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedMemberId = searchParams.get('member_id');

    if (session.role === 'member' && requestedMemberId && requestedMemberId !== session.member_id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const memberId = session.role === 'member' ? session.member_id : requestedMemberId;

    const rawRows = await getRows('Loans');
    const loans = rowsToObjects(rawRows);

    let filteredLoans = loans;
    if (memberId) {
      filteredLoans = loans.filter((l) => l.member_id === memberId);
    }

    // Sanitize response by removing internal _rowNumber
    const responseData = filteredLoans.map(({ _rowNumber, ...rest }) => rest);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GET /api/loans error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve loans: ' + error.message },
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
    const { member_id, principal_amount, interest_rate, term_months, release_date } = body;

    // Validate presence of required inputs
    if (
      !member_id ||
      principal_amount === undefined ||
      interest_rate === undefined ||
      term_months === undefined ||
      !release_date
    ) {
      return NextResponse.json(
        {
          error:
            'Required fields missing. Provide: member_id, principal_amount, interest_rate, term_months, release_date.',
        },
        { status: 400 }
      );
    }

    const principal = parseFloat(principal_amount);
    const rate = parseFloat(interest_rate);
    const term = parseInt(term_months, 10);

    if (isNaN(principal) || isNaN(rate) || isNaN(term) || principal <= 0 || rate < 0 || term <= 0) {
      return NextResponse.json(
        {
          error:
            'Invalid numeric values. principal_amount and term_months must be positive. interest_rate must be non-negative.',
        },
        { status: 400 }
      );
    }

    // Verify member exists and is active
    const rawMembers = await getRows('Members');
    const members = rowsToObjects(rawMembers);
    const member = members.find((m) => m.member_id === member_id);

    if (!member) {
      return NextResponse.json(
        { error: `Associated member with ID "${member_id}" does not exist.` },
        { status: 400 }
      );
    }
    if (member.status !== 'active') {
      return NextResponse.json(
        { error: `Associated member with ID "${member_id}" is inactive/suspended.` },
        { status: 400 }
      );
    }

    const rawLoans = await getRows('Loans');
    const loans = rowsToObjects(rawLoans);
    const loan_id = generateLoanId(loans);

    // Calculate flat interest: total_interest = principal * rate * term
    const total_interest = principal * rate * term;
    const total_payable = principal + total_interest;
    const balance = total_payable;
    const now = new Date().toISOString();

    const newLoan = {
      loan_id,
      member_id,
      principal_amount: principal,
      interest_rate: rate,
      term_months: term,
      total_payable,
      balance,
      status: 'active',
      release_date,
      created_at: now,
      updated_at: now,
    };

    await appendRow('Loans', newLoan);

    // Write audit log
    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'CREATE_LOAN',
      entityType: 'Loans',
      entityId: loan_id,
      details: {
        member_id,
        principal_amount: principal,
        interest_rate: rate,
        term_months: term,
        total_payable,
      },
    });

    const { _rowNumber, ...sanitizedLoan } = newLoan;
    return NextResponse.json(sanitizedLoan, { status: 201 });
  } catch (error) {
    console.error('POST /api/loans error:', error);
    return NextResponse.json(
      { error: 'Failed to create loan: ' + error.message },
      { status: 500 }
    );
  }
}
