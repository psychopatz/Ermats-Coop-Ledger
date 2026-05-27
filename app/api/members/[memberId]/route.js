// app/api/members/[memberId]/route.js
import { NextResponse } from 'next/server';
import { getRows, rowsToObjects, updateRow } from '@/lib/googleSheets';
import { writeAuditLog } from '@/lib/auditLog';

export async function GET(request, { params }) {
  try {
    const { memberId } = await params;
    const rawRows = await getRows('Members');
    const members = rowsToObjects(rawRows);

    const member = members.find((m) => m.member_id === memberId);
    if (!member) {
      return NextResponse.json(
        { error: `Member with ID "${memberId}" not found.` },
        { status: 404 }
      );
    }

    const { _rowNumber, ...sanitizedMember } = member;
    return NextResponse.json(sanitizedMember);
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
    const { memberId } = await params;
    const body = await request.json();

    // Prevent changing member_id
    if (body.member_id && body.member_id !== memberId) {
      return NextResponse.json(
        { error: 'Modifying the member_id is not allowed.' },
        { status: 400 }
      );
    }

    const rawRows = await getRows('Members');
    const members = rowsToObjects(rawRows);

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
      actorEmail: 'admin@test.com', // Admin actor in MVP
      action: 'UPDATE_MEMBER',
      entityType: 'Members',
      entityId: memberId,
      details: { updatedFields: Object.keys(body).filter((k) => k !== '_rowNumber') },
    });

    const { _rowNumber, ...sanitizedMember } = updatedMember;
    return NextResponse.json(sanitizedMember);
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
    const { memberId } = await params;
    const rawRows = await getRows('Members');
    const members = rowsToObjects(rawRows);

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
      actorEmail: 'admin@test.com',
      action: 'SOFT_DELETE_MEMBER',
      entityType: 'Members',
      entityId: memberId,
      details: { status: 'inactive' },
    });

    const { _rowNumber, ...sanitizedMember } = updatedMember;
    return NextResponse.json(sanitizedMember);
  } catch (error) {
    console.error('DELETE /api/members/[memberId] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete member: ' + error.message },
      { status: 500 }
    );
  }
}
