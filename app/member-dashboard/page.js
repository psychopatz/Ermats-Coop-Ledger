// app/member-dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MemberDashboard() {
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');

  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem('coop_member_id');
    const name = localStorage.getItem('coop_member_name');
    const email = localStorage.getItem('coop_member_email');

    if (!id) {
      router.push('/member-login');
      return;
    }

    setMemberId(id);
    setMemberName(name || '');
    setMemberEmail(email || '');

    fetchData(id);
  }, [router]);

  const fetchData = async (id) => {
    setIsLoading(true);
    setError('');
    try {
      const [loansRes, paymentsRes] = await Promise.all([
        fetch(`/api/loans?member_id=${id}`),
        fetch(`/api/payments?member_id=${id}`),
      ]);

      if (!loansRes.ok || !paymentsRes.ok) {
        throw new Error('Failed to retrieve transaction records.');
      }

      const loansData = await loansRes.json();
      const paymentsData = await paymentsRes.json();

      setLoans(loansData);
      setPayments(paymentsData);
    } catch (err) {
      setError(err.message || 'Error occurred while loading data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('coop_member_id');
    localStorage.removeItem('coop_member_name');
    localStorage.removeItem('coop_member_email');
    router.push('/');
  };

  // Computations
  const totalLoans = loans.length;
  const totalPayable = loans.reduce((acc, curr) => acc + parseFloat(curr.total_payable || 0), 0);
  const totalBalance = loans.reduce((acc, curr) => acc + parseFloat(curr.balance || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Navigation */}
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
              <p className="text-sm font-medium text-slate-200">{memberName}</p>
              <p className="text-xs text-slate-500">{memberEmail}</p>
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

      {/* Main Dashboard Space */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex gap-3 items-center">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-slate-900/60 border border-slate-850 rounded-2xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-slate-900 rounded w-1/4"></div>
              <div className="h-48 bg-slate-900 border border-slate-850 rounded-2xl"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Account Reference
                </p>
                <p className="text-2xl font-bold text-slate-200 mt-2">{memberId}</p>
                <p className="text-xs text-slate-500 mt-1">Authorized ID in Google Sheets</p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Payable Amount
                </p>
                <p className="text-2xl font-bold text-indigo-400 mt-2">
                  $
                  {totalPayable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">{totalLoans} configured loan(s)</p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Outstanding Balance
                </p>
                <p className="text-2xl font-bold text-emerald-400 mt-2">
                  $
                  {totalBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">Pending settlement balance</p>
              </div>
            </section>

            {/* Loans Table */}
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
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                  loan.status === 'paid'
                                    ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                }`}
                              >
                                {loan.status}
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

            {/* Payments Table */}
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
                        <th className="px-6 py-4">Collector</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-sm">
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
                            <td className="px-6 py-4 text-xs text-slate-500">{p.received_by}</td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                  p.status === 'voided'
                                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                }`}
                              >
                                {p.status}
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
        )}
      </main>
    </div>
  );
}
