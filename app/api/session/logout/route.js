import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(request) {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response, request);
  return response;
}