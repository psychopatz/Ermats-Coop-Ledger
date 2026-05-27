// app/api/members/route.js
import { NextResponse } from 'next/server';
import { getRows, rowsToObjects, appendRow } from '@/lib/googleSheets';
import { generateMemberId } from '@/lib/ids';
import { writeAuditLog } from '@/lib/auditLog';

export async function GET() {
  try {
    const rawRows = await getRows('Members');
    const members = rowsToObjects(rawRows);

    // Sanitize response by removing internal _rowNumber
    const responseData = members.map(({ _rowNumber, ...rest }) => rest);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GET /api/members error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve members: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { full_name, email, access_code } = body;

    // Validate request body
    if (!full_name || !email || !access_code) {
      return NextResponse.json(
        { error: 'Required fields missing. Provide: full_name, email, access_code.' },
        { status: 400 }
      );
    }

    const rawRows = await getRows('Members');
    const members = rowsToObjects(rawRows);

    // Check for duplicate email (case-insensitive)
    const isDuplicate = members.some(
      (m) => m.email && m.email.toLowerCase() === email.toLowerCase()
    );
    if (isDuplicate) {
      return NextResponse.json(
        { error: `A member with email "${email}" already exists.` },
        { status: 400 }
      );
    }

    const member_id = generateMemberId(members);
    const now = new Date().toISOString();

    // SAFETY NOTE: Plain access_code is used for testing only.
    // In production, this must be hashed (e.g. using access_code_hash via bcrypt or argon2)
    // and secure HTTP-only sessions must be used.
    const newMember = {
      member_id,
      full_name,
      email,
      access_code,
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    await appendRow('Members', newMember);

    // Write audit log
    await writeAuditLog({
      actorEmail: 'admin@test.com', // Admin or system actor for registration
      action: 'CREATE_MEMBER',
      entityType: 'Members',
      entityId: member_id,
      details: { full_name, email, status: 'active' },
    });

    const { _rowNumber, ...sanitizedMember } = newMember;
    return NextResponse.json(sanitizedMember, { status: 201 });
  } catch (error) {
    console.error('POST /api/members error:', error);
    return NextResponse.json(
      { error: 'Failed to create member: ' + error.message },
      { status: 500 }
    );
  }
}
