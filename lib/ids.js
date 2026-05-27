// lib/ids.js

/**
 * Generates the next member ID (e.g., MBR-000001)
 */
export function generateMemberId(existingMembers) {
  if (!existingMembers || existingMembers.length === 0) {
    return 'MBR-000001';
  }
  let maxNum = 0;
  existingMembers.forEach((m) => {
    const id = m.member_id;
    if (id && id.startsWith('MBR-')) {
      const num = parseInt(id.replace('MBR-', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `MBR-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Generates the next loan ID (e.g., LOAN-000001)
 */
export function generateLoanId(existingLoans) {
  if (!existingLoans || existingLoans.length === 0) {
    return 'LOAN-000001';
  }
  let maxNum = 0;
  existingLoans.forEach((l) => {
    const id = l.loan_id;
    if (id && id.startsWith('LOAN-')) {
      const num = parseInt(id.replace('LOAN-', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `LOAN-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Generates the next payment ID (e.g., PAY-000001)
 */
export function generatePaymentId(existingPayments) {
  if (!existingPayments || existingPayments.length === 0) {
    return 'PAY-000001';
  }
  let maxNum = 0;
  existingPayments.forEach((p) => {
    const id = p.payment_id;
    if (id && id.startsWith('PAY-')) {
      const num = parseInt(id.replace('PAY-', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `PAY-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Generates the next bulletin ID (e.g., BUL-000001)
 */
export function generateBulletinId(existingBulletins) {
  if (!existingBulletins || existingBulletins.length === 0) {
    return 'BUL-000001';
  }

  let maxNum = 0;
  existingBulletins.forEach((bulletin) => {
    const id = bulletin.bulletin_id;
    if (id && id.startsWith('BUL-')) {
      const num = parseInt(id.replace('BUL-', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  return `BUL-${String(maxNum + 1).padStart(6, '0')}`;
}

/**
 * Generates the next loan request ID (e.g., LRQ-000001)
 */
export function generateLoanRequestId(existingLoanRequests) {
  if (!existingLoanRequests || existingLoanRequests.length === 0) {
    return 'LRQ-000001';
  }

  let maxNum = 0;
  existingLoanRequests.forEach((request) => {
    const id = request.request_id;
    if (id && id.startsWith('LRQ-')) {
      const num = parseInt(id.replace('LRQ-', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  return `LRQ-${String(maxNum + 1).padStart(6, '0')}`;
}

/**
 * Generates the next audit ID (e.g., AUD-000001)
 */
export function generateAuditId(existingAuditRows) {
  if (!existingAuditRows || existingAuditRows.length === 0) {
    return 'AUD-000001';
  }
  let maxNum = 0;
  existingAuditRows.forEach((a) => {
    const id = a.audit_id;
    if (id && id.startsWith('AUD-')) {
      const num = parseInt(id.replace('AUD-', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `AUD-${String(nextNum).padStart(6, '0')}`;
}
