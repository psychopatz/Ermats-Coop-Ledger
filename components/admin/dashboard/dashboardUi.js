export function createLoanForm(today) {
  return {
    member_id: '',
    principal_amount: '',
    interest_rate: '0.03',
    term_months: '12',
    release_date: today,
  };
}

export const DEFAULT_MEMBER_FORM = {
  full_name: '',
  email: '',
  access_code: '',
};

export function createAdminTabs({ members, loans, loanRequests, bulletins, audits }) {
  return [
    { id: 'members', name: 'Members Directory', count: members.length },
    {
      id: 'loans',
      name: 'Loans & Requests',
      count: loans.length + loanRequests.filter((request) => request.status === 'pending_approval').length,
    },
    { id: 'bulletins', name: 'Member Bulletin', count: bulletins.length },
    { id: 'audits', name: 'System Audit Logs', count: audits.length },
  ];
}