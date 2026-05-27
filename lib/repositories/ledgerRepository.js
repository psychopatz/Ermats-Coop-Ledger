import { getRows, rowsToObjects } from '@/lib/googleSheets';
import { normalizePaymentMethod, normalizePaymentStatus, normalizeReferenceCode } from '@/lib/domain/payments';

export async function listMembers() {
  return rowsToObjects(await getRows('Members'));
}

export async function listLoans() {
  return rowsToObjects(await getRows('Loans'));
}

export async function listPayments() {
  return rowsToObjects(await getRows('Payments')).map((payment) => ({
    ...payment,
    payment_method: normalizePaymentMethod(payment.payment_method),
    reference_code: normalizeReferenceCode(payment.reference_code),
    status: normalizePaymentStatus(payment.status),
  }));
}

export async function listAuditLogs() {
  return rowsToObjects(await getRows('Audit_Log'));
}

export async function readLedgerSnapshot({ includeAudits = true } = {}) {
  const [members, loans, payments, audits = []] = await Promise.all([
    listMembers(),
    listLoans(),
    listPayments(),
    includeAudits ? listAuditLogs() : Promise.resolve([]),
  ]);

  return {
    members,
    loans,
    payments,
    audits,
  };
}