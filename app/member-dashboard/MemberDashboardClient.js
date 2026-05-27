'use client';

import { useRouter } from 'next/navigation';

function getStatusBadgeClass(status) {
  if (status === 'paid') {
    return 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400';
  }

  if (status === 'partial') {
    return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  }

  return 'bg-slate-500/10 border border-slate-500/30 text-slate-300';
}

function formatRepaymentStatus(status) {
  if (status === 'not_paid') {
    return 'Not Paid';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function MemberDashboardClient({ session, initialData }) {
  const { loans, payments, summary } = initialData;

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/session/logout', { method: 'POST' });
    } finally {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Coop Ledger
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
              Member Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-200">{session.full_name}</p>
              <p className="text-xs text-slate-500">{session.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="py-1.5 px-3.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all text-xs font-semibold cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Account Reference
                </p>
                <p className="text-2xl font-bold text-slate-200 mt-2">{session.member_id}</p>
                <p className="text-xs text-slate-500 mt-1">Authorized ID in Google Sheets</p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Payable Amount
                </p>
                <p className="text-2xl font-bold text-indigo-400 mt-2">
                  $
                  {summary.total_payable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">{summary.total_loans} configured loan(s)</p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Outstanding Balance
                </p>
                <p className="text-2xl font-bold text-emerald-400 mt-2">
                  $
                  {summary.total_balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">Pending settlement balance</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-200">My Cooperative Loans</h2>
              <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                      <tr>
                        <th className="px-6 py-4">Loan ID</th>
                        <th className="px-6 py-4">Principal</th>
                        <th className="px-6 py-4">Monthly Rate</th>
                        <th className="px-6 py-4">Term</th>
                        <th className="px-6 py-4">Total Payable</th>
                        <th className="px-6 py-4">Remaining Balance</th>
                        <th className="px-6 py-4">Release Date</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {loans.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-slate-500 text-sm">
                            No loans registered under your account.
                          </td>
                        </tr>
                      ) : (
                        loans.map((loan) => (
                          <tr key={loan.loan_id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                              {loan.loan_id}
                            </td>
                            <td className="px-6 py-4">
                              $
                              {parseFloat(loan.principal_amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-6 py-4">
                              {(parseFloat(loan.interest_rate) * 100).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4">{loan.term_months} mos</td>
                            <td className="px-6 py-4 font-medium">
                              $
                              {parseFloat(loan.total_payable).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-6 py-4 font-medium text-emerald-400">
                              $
                              {parseFloat(loan.balance).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-6 py-4 text-slate-450">{loan.release_date}</td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClass(loan.repayment_status)}`}
                              >
                                {formatRepaymentStatus(loan.repayment_status)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-200">Payment History</h2>
              <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                      <tr>
                        <th className="px-6 py-4">Payment ID</th>
                        <th className="px-6 py-4">Loan ID</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Amount Received</th>
                        <th className="px-6 py-4">Method</th>
                        <th className="px-6 py-4">Collector</th>
                        <th className="px-6 py-4 text-center">Repayment</th>
                        <th className="px-6 py-4 text-center">Record</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-slate-500 text-sm">
                            No payment transactions recorded.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.payment_id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                              {p.payment_id}
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-450">{p.loan_id}</td>
                            <td className="px-6 py-4 text-slate-450">{p.payment_date}</td>
                            <td className="px-6 py-4 font-medium text-slate-250">
                              $
                              {parseFloat(p.amount_received).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-6 py-4 text-xs uppercase text-slate-350">{p.payment_method}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{p.received_by}</td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClass(p.repayment_status)}`}
                              >
                                {formatRepaymentStatus(p.repayment_status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                  p.record_status === 'voided'
                                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                }`}
                              >
                                {p.record_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
        </>
      </main>
    </div>
  );
}