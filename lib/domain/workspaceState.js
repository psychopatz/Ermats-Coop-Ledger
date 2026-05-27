import { enrichLoans, enrichPayments, groupPaymentsByPeriod, parseAmount } from '@/lib/domain/payments';

export const IDLE_SYNC_STATUS = {
  state: 'idle',
  message: '',
};

function sortAuditsDescending(audits) {
  return [...audits].sort((left, right) => String(right.timestamp).localeCompare(String(left.timestamp)));
}

function sortRowsNewestFirst(rows, dateKey, tieKey) {
  return [...rows].sort((left, right) => {
    return String(right[dateKey]).localeCompare(String(left[dateKey]))
      || String(right[tieKey]).localeCompare(String(left[tieKey]));
  });
}

export function sortBulletinsDescending(bulletins) {
  return sortRowsNewestFirst(bulletins, 'updated_at', 'bulletin_id');
}

export function sortLoanRequestsDescending(loanRequests) {
  return sortRowsNewestFirst(loanRequests, 'created_at', 'request_id');
}

export function getActiveBulletin(bulletins) {
  return sortBulletinsDescending(bulletins).find((bulletin) => bulletin.status === 'active') || null;
}

export function createOptimisticId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function buildMemberWorkspaceData({
  loans = [],
  payments = [],
  bulletins = [],
  loanRequests = [],
  syncStatus = IDLE_SYNC_STATUS,
}) {
  const enrichedLoans = enrichLoans(loans, payments);
  const enrichedPayments = enrichPayments(payments, enrichedLoans);
  const sortedLoanRequests = sortLoanRequestsDescending(loanRequests);
  const pendingPayments = enrichedPayments.filter((payment) => payment.record_status === 'pending_approval');
  const approvedPayments = enrichedPayments.filter((payment) => payment.record_status === 'approved');
  const voidedPayments = enrichedPayments.filter((payment) => payment.record_status === 'voided');

  return {
    bulletins: sortBulletinsDescending(bulletins),
    activeBulletin: getActiveBulletin(bulletins),
    loans: enrichedLoans,
    payments: enrichedPayments,
    loanRequests: sortedLoanRequests,
    pendingLoanRequests: sortedLoanRequests.filter((request) => request.status === 'pending_approval'),
    approvedLoanRequests: sortedLoanRequests.filter((request) => request.status === 'approved'),
    rejectedLoanRequests: sortedLoanRequests.filter((request) => request.status === 'rejected'),
    pendingPayments,
    approvedPayments,
    voidedPayments,
    availableLoans: enrichedLoans.filter((loan) => loan.repayment_status !== 'paid'),
    summary: {
      total_loans: enrichedLoans.length,
      total_payable: enrichedLoans.reduce((sum, loan) => sum + parseAmount(loan.total_payable), 0),
      total_balance: enrichedLoans.reduce((sum, loan) => sum + parseAmount(loan.balance), 0),
      pending_count: pendingPayments.length,
      pending_amount: pendingPayments.reduce((sum, payment) => sum + parseAmount(payment.amount_received), 0),
      approved_count: approvedPayments.length,
      approved_amount: approvedPayments.reduce((sum, payment) => sum + parseAmount(payment.amount_received), 0),
      voided_count: voidedPayments.length,
      pending_loan_request_count: sortedLoanRequests.filter((request) => request.status === 'pending_approval').length,
    },
    syncStatus,
  };
}

export function buildAdminWorkspaceData({
  members = [],
  bulletins = [],
  loans = [],
  loanRequests = [],
  payments = [],
  audits = [],
  syncStatus = IDLE_SYNC_STATUS,
}) {
  const enrichedLoans = enrichLoans(loans, payments);
  const enrichedPayments = enrichPayments(payments, enrichedLoans);
  const sortedBulletins = sortBulletinsDescending(bulletins);
  const sortedLoanRequests = sortLoanRequestsDescending(loanRequests);

  return {
    members,
    bulletins: sortedBulletins,
    activeBulletin: getActiveBulletin(sortedBulletins),
    loans: enrichedLoans,
    loanRequests: sortedLoanRequests,
    payments: enrichedPayments,
    audits: sortAuditsDescending(audits),
    paymentGroups: {
      year: groupPaymentsByPeriod(enrichedPayments, 'year'),
      month: groupPaymentsByPeriod(enrichedPayments, 'month'),
      week: groupPaymentsByPeriod(enrichedPayments, 'week'),
    },
    syncStatus,
  };
}

export function calculateApprovedLoanUpdate(loan, amountReceived) {
  const amount = parseAmount(amountReceived);
  const currentBalance = parseAmount(loan.balance);
  let balance = currentBalance - amount;
  let status = loan.status;

  if (balance <= 0) {
    balance = 0;
    status = 'paid';
  } else if (status === 'paid') {
    status = 'active';
  }

  return {
    ...loan,
    balance,
    status,
  };
}

export function calculateVoidedLoanUpdate(loan, amountReceived) {
  const amount = parseAmount(amountReceived);
  const currentBalance = parseAmount(loan.balance);
  const balance = currentBalance + amount;

  return {
    ...loan,
    balance,
    status: balance > 0 ? 'active' : loan.status,
  };
}