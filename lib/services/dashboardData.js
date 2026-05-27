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

  return {
    loans: enrichedLoans,
    payments: enrichedPayments,
    summary: {
      total_loans: enrichedLoans.length,
      total_payable: enrichedLoans.reduce((sum, loan) => sum + parseAmount(loan.total_payable), 0),
      total_balance: enrichedLoans.reduce((sum, loan) => sum + parseAmount(loan.balance), 0),
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