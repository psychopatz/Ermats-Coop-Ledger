// app/api/members/[memberId]/route.js
import { NextResponse } from 'next/server';
import { updateRow } from '@/lib/googleSheets';
import { writeAuditLog } from '@/lib/auditLog';
import { sanitizeMember } from '@/lib/domain/members';
import { getAdminSession, getSession } from '@/lib/session';
import { listMembers } from '@/lib/repositories/ledgerRepository';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { memberId } = await params;

    if (session.role !== 'admin' && session.member_id !== memberId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const members = await listMembers();

    const member = members.find((m) => m.member_id === memberId);
    if (!member) {
      return NextResponse.json(
        { error: `Member with ID "${memberId}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(sanitizeMember(member));
  } catch (error) {
    console.error('GET /api/members/[memberId] error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve member: ' + error.message },
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

    const { memberId } = await params;
    const body = await request.json();

    // Prevent changing member_id
    if (body.member_id && body.member_id !== memberId) {
      return NextResponse.json(
        { error: 'Modifying the member_id is not allowed.' },
        { status: 400 }
      );
    }

    const members = await listMembers();

    const existingMember = members.find((m) => m.member_id === memberId);
    if (!existingMember) {
      return NextResponse.json(
        { error: `Member with ID "${memberId}" not found.` },
        { status: 404 }
      );
    }

    // Merge updates, set updated_at, and preserve member_id
    const updatedMember = {
      ...existingMember,
      ...body,
      member_id: memberId,
      updated_at: new Date().toISOString(),
    };

    await updateRow('Members', existingMember._rowNumber, updatedMember);

    // Write audit log
    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'UPDATE_MEMBER',
      entityType: 'Members',
      entityId: memberId,
      details: { updatedFields: Object.keys(body).filter((k) => k !== '_rowNumber') },
    });

    return NextResponse.json(sanitizeMember(updatedMember));
  } catch (error) {
    console.error('PATCH /api/members/[memberId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update member: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const { memberId } = await params;
    const members = await listMembers();

    const existingMember = members.find((m) => m.member_id === memberId);
    if (!existingMember) {
      return NextResponse.json(
        { error: `Member with ID "${memberId}" not found.` },
        { status: 404 }
      );
    }

    // Soft delete: set status to inactive
    const updatedMember = {
      ...existingMember,
      status: 'inactive',
      updated_at: new Date().toISOString(),
    };

    await updateRow('Members', existingMember._rowNumber, updatedMember);

    // Write audit log
    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'SOFT_DELETE_MEMBER',
      entityType: 'Members',
      entityId: memberId,
      details: { status: 'inactive' },
    });

    return NextResponse.json(sanitizeMember(updatedMember));
  } catch (error) {
    console.error('DELETE /api/members/[memberId] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete member: ' + error.message },
      { status: 500 }
    );
  }
}
