import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { setSessionCookie } from '@/lib/session';

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request) {
  try {
    const configuredEmail = process.env.ADMIN_EMAIL;
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredEmail || !configuredPassword) {
      return NextResponse.json(
        {
          error:
            'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (!safeCompare(email, configuredEmail) || !safeCompare(password, configuredPassword)) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    const response = NextResponse.json({ email: configuredEmail, role: 'admin' });
    setSessionCookie(response, {
      role: 'admin',
      email: configuredEmail,
      full_name: 'Admin',
    }, request);

    return response;
  } catch (error) {
    console.error('POST /api/admin/login error:', error);
    return NextResponse.json({ error: 'Admin authentication failed.' }, { status: 500 });
  }
}