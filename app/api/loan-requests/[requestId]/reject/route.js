import { NextResponse } from 'next/server';
import { updateRow } from '@/lib/googleSheets';
import { writeAuditLog } from '@/lib/auditLog';
import { listLoanRequests } from '@/lib/repositories/ledgerRepository';
import { getAdminSession } from '@/lib/session';

export async function PATCH(request, { params }) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json().catch(() => ({}));
    const adminNotes = String(body.admin_notes || '').trim();
    const loanRequests = await listLoanRequests();
    const loanRequest = loanRequests.find((entry) => entry.request_id === requestId);

    if (!loanRequest) {
      return NextResponse.json({ error: `Loan request with ID "${requestId}" not found.` }, { status: 404 });
    }

    if (loanRequest.status !== 'pending_approval') {
      return NextResponse.json({ error: 'Only pending loan requests can be rejected.' }, { status: 400 });
    }

    const updatedRequest = {
      ...loanRequest,
      status: 'rejected',
      reviewed_by: adminSession.email,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    };

    await updateRow('Loan_Requests', loanRequest._rowNumber, updatedRequest);

    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'REJECT_LOAN_REQUEST',
      entityType: 'Loan_Requests',
      entityId: requestId,
      details: {
        member_id: loanRequest.member_id,
        admin_notes: adminNotes,
      },
    });

    return NextResponse.json({ request: updatedRequest }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/loan-requests/[requestId]/reject error:', error);
    return NextResponse.json(
      { error: 'Failed to reject loan request: ' + error.message },
      { status: 500 }
    );
  }
}