// app/api/member/login/route.js
import { NextResponse } from 'next/server';
import { getRows, rowsToObjects } from '@/lib/googleSheets';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, access_code } = body;

    if (!email || !access_code) {
      return NextResponse.json(
        { error: 'Email and access_code are required.' },
        { status: 400 }
      );
    }

    const rawRows = await getRows('Members');
    const members = rowsToObjects(rawRows);

    // Find an active member with matching email and access code
    const member = members.find(
      (m) =>
        m.email &&
        m.email.toLowerCase() === email.toLowerCase() &&
        String(m.access_code) === String(access_code) &&
        m.status === 'active'
    );

    if (!member) {
      return NextResponse.json(
        { error: 'Invalid email or access code, or member is currently inactive.' },
        { status: 401 }
      );
    }

    // SAFETY NOTE: This login mechanism is for testing/MVP purposes only.
    // 1. Production must store access_code as a secure hash (e.g. bcrypt or argon2).
    // 2. Production must establish secure, signed HTTP-only sessions (e.g., using next-auth, iron-session, or JWT in HTTP-only cookies)
    //    instead of storing credentials and raw IDs in localStorage on the client side.
    return NextResponse.json({
      member_id: member.member_id,
      full_name: member.full_name,
      email: member.email,
    });
  } catch (error) {
    console.error('POST /api/member/login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed: ' + error.message },
      { status: 500 }
    );
  }
}
