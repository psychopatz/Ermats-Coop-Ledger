import { NextResponse } from 'next/server';
import { appendRow, updateRow } from '@/lib/googleSheets';
import { writeAuditLog } from '@/lib/auditLog';
import { generateBulletinId } from '@/lib/ids';
import { listBulletins } from '@/lib/repositories/ledgerRepository';
import { getAdminSession } from '@/lib/session';

export async function POST(request) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const message = String(body.message || '').trim();
    const bulletins = await listBulletins();
    const activeBulletins = bulletins.filter((bulletin) => bulletin.status === 'active');
    const now = new Date().toISOString();

    await Promise.all(activeBulletins.map((bulletin) => updateRow('Admin_Bulletins', bulletin._rowNumber, {
      ...bulletin,
      status: 'archived',
      updated_at: now,
    })));

    if (!message) {
      await writeAuditLog({
        actorEmail: adminSession.email,
        action: 'CLEAR_BULLETIN',
        entityType: 'Admin_Bulletins',
        entityId: activeBulletins[0]?.bulletin_id || 'none',
        details: { archived_count: activeBulletins.length },
      });

      return NextResponse.json({ bulletin: null }, { status: 200 });
    }

    const bulletin = {
      bulletin_id: generateBulletinId(bulletins),
      message,
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    await appendRow('Admin_Bulletins', bulletin);

    await writeAuditLog({
      actorEmail: adminSession.email,
      action: 'SAVE_BULLETIN',
      entityType: 'Admin_Bulletins',
      entityId: bulletin.bulletin_id,
      details: { message },
    });

    return NextResponse.json({ bulletin }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bulletins error:', error);
    return NextResponse.json(
      { error: 'Failed to save bulletin: ' + error.message },
      { status: 500 }
    );
  }
}