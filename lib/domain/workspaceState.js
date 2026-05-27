import { enrichLoans, enrichPayments, groupPaymentsByPeriod, parseAmount } from '@/lib/domain/payments';

export const IDLE_SYNC_STATUS = {
  state: 'idle',
  message: '',
};

function sortAuditsDescending(audits) {
  return [...audits].sort((left, right) => String(right.timestamp).localeCompare(String(left.timestamp)));
}

export function createOptimisticId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function buildMemberWorkspaceData({ loans = [], payments = [], syncStatus = IDLE_SYNC_STATUS }) {
  const enrichedLoans = enrichLoans(loans, payments);
  const enrichedPayments = enrichPayments(payments, enrichedLoans);
  const pendingPayments = enrichedPayments.filter((payment) => payment.record_status === 'pending_approval');
  const approvedPayments = enrichedPayments.filter((payment) => payment.record_status === 'approved');
  const voidedPayments = enrichedPayments.filter((payment) => payment.record_status === 'voided');

  return {
    loans: enrichedLoans,
    payments: enrichedPayments,
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
    },
    syncStatus,
  };
}

export function buildAdminWorkspaceData({
  members = [],
  loans = [],
  payments = [],
  audits = [],
  syncStatus = IDLE_SYNC_STATUS,
}) {
  const enrichedLoans = enrichLoans(loans, payments);
  const enrichedPayments = enrichPayments(payments, enrichedLoans);

  return {
    members,
    loans: enrichedLoans,
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