import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'coop_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function normalizeSecret(secret) {
  return secret?.replace(/\\r/g, '').replace(/\\n/g, '\n');
}

function getSessionSecret() {
  const secret =
    process.env.APP_SESSION_SECRET || normalizeSecret(process.env.GOOGLE_PRIVATE_KEY);

  if (!secret) {
    throw new Error(
      'APP_SESSION_SECRET or GOOGLE_PRIVATE_KEY must be configured to sign session cookies.'
    );
  }

  return secret;
}

function sign(encodedPayload) {
  return createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

function encodeSession(session) {
  const encodedPayload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function decodeSession(value) {
  if (!value) {
    return null;
  }

  const [encodedPayload, signature] = value.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

    if (!payload?.role || !payload?.exp || payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function shouldUseSecureCookies(request) {
  const forwardedProto = request?.headers?.get?.('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto === 'https';
  }

  if (!request?.url) {
    return process.env.NODE_ENV === 'production';
  }

  const url = new URL(request.url);
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return false;
  }

  return url.protocol === 'https:';
}

function createCookieOptions(request, maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookies(request),
    path: '/',
    maxAge,
  };
}

export function createSessionPayload(session) {
  return {
    role: session.role,
    member_id: session.member_id || null,
    full_name: session.full_name || '',
    email: session.email || '',
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
}

export function setSessionCookie(response, session, request) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    encodeSession(createSessionPayload(session)),
    createCookieOptions(request)
  );
  return response;
}

export function clearSessionCookie(response, request) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...createCookieOptions(request, 0),
    expires: new Date(0),
  });
  return response;
}

export async function getSession() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function getMemberSession() {
  const session = await getSession();
  return session?.role === 'member' ? session : null;
}

export async function getAdminSession() {
  const session = await getSession();
  return session?.role === 'admin' ? session : null;
}