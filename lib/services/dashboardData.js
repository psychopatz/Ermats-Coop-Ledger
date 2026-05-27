import { enrichLoans, enrichPayments, groupPaymentsByPeriod, parseAmount } from '@/lib/domain/payments';
import { listLoans, listPayments, readLedgerSnapshot } from '@/lib/repositories/ledgerRepository';

function sortAuditsDescending(audits) {
  return [...audits].sort((left, right) => String(right.timestamp).localeCompare(String(left.timestamp)));
}

export async function getMemberDashboardData(memberId) {
  const [loans, payments] = await Promise.all([listLoans(), listPayments()]);
  const memberLoans = loans.filter((loan) => loan.member_id === memberId);
  const memberPayments = payments.filter((payment) => payment.member_id === memberId);
  const enrichedLoans = enrichLoans(memberLoans, memberPayments);
  const enrichedPayments = enrichPayments(memberPayments, enrichedLoans);
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
  };
}

export async function getAdminWorkspaceData() {
  const { members, loans, payments, audits } = await readLedgerSnapshot();
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
  };
}