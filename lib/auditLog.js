// lib/auditLog.js
import { appendRow } from './googleSheets';
import { generateAuditId } from './ids';
import { listAuditLogs } from '@/lib/repositories/ledgerRepository';

/**
 * Appends a new audit log entry to the Audit_Log sheet.
 * Format of Audit_Log columns:
 * audit_id | timestamp | actor_email | action | entity_type | entity_id | details
 */
export async function writeAuditLog({ actorEmail, action, entityType, entityId, details }) {
  try {
    const logs = await listAuditLogs();
    const auditId = generateAuditId(logs);

    const logEntry = {
      audit_id: auditId,
      timestamp: new Date().toISOString(),
      actor_email: actorEmail || 'system@test.com',
      action: action || '',
      entity_type: entityType || '',
      entity_id: entityId || '',
      details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
    };

    await appendRow('Audit_Log', logEntry);
    return auditId;
  } catch (error) {
    console.error('Failed to write audit log:', error);
    throw error;
  }
}
