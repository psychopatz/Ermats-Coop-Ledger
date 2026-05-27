import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export async function POST(request) {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response, request);
  return response;
}