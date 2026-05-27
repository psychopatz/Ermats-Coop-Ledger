// app/api/audits/route.js
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';
import { listAuditLogs } from '@/lib/repositories/ledgerRepository';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const logs = await listAuditLogs();

    // Sort audit logs by timestamp descending so latest activities appear first
    const sortedLogs = logs.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });

    const responseData = sortedLogs.map(({ _rowNumber, ...rest }) => rest);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GET /api/audits error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit log entries: ' + error.message },
      { status: 500 }
    );
  }
}
