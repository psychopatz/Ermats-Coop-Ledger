// app/api/members/route.js
import { NextResponse } from 'next/server';
import { appendRow } from '@/lib/googleSheets';
import { generateMemberId } from '@/lib/ids';
import { writeAuditLog } from '@/lib/auditLog';
import { sanitizeMember } from '@/lib/domain/members';
import { getAdminSession } from '@/lib/session';
import { listMembers } from '@/lib/repositories/ledgerRepository';

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const members = await listMembers();
    const responseData = members.map(sanitizeMember);

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
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, email, access_code } = body;

    // Validate request body
    if (!full_name || !email || !access_code) {
      return NextResponse.json(
        { error: 'Required fields missing. Provide: full_name, email, access_code.' },
        { status: 400 }
      );
    }

    const members = await listMembers();

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
      actorEmail: adminSession.email,
      action: 'CREATE_MEMBER',
      entityType: 'Members',
      entityId: member_id,
      details: { full_name, email, status: 'active' },
    });

    const sanitizedMember = sanitizeMember(newMember);
    return NextResponse.json(sanitizedMember, { status: 201 });
  } catch (error) {
    console.error('POST /api/members error:', error);
    return NextResponse.json(
      { error: 'Failed to create member: ' + error.message },
      { status: 500 }
    );
  }
}
