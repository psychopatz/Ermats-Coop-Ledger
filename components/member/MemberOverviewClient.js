'use client';

import { useMemberWorkspace } from '@/components/member/MemberWorkspaceProvider';
import {
  formatCurrency,
  formatRecordStatus,
  formatRepaymentStatus,
  getRecordStatusClass,
  getRepaymentStatusClass,
} from '@/components/member/memberUi';

function clampPercentage(value) {
  return Math.max(0, Math.min(100, value));
}

function getDefaultBulletinMessage() {
  return 'Hello there. Your latest verified payments, loan balances, and admin updates will appear here. If you have a pending payment or loan request, the admin will review it before it changes your official ledger.';
}

function LoanProgressRing({ loan, pendingAmount }) {
  const total = Number.parseFloat(loan.total_payable) || 0;
  const remaining = Number.parseFloat(loan.balance) || 0;
  const paid = Math.max(total - remaining, 0);
  const normalizedPending = Math.min(pendingAmount, remaining);
  const paidPercent = total > 0 ? clampPercentage((paid / total) * 100) : 0;
  const pendingPercent = total > 0 ? clampPercentage((normalizedPending / total) * 100) : 0;
  const remainingPercent = total > 0 ? clampPercentage((remaining / total) * 100) : 0;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  const getOffset = (percent) => circumference - ((percent / 100) * circumference);

  return (
    <div className="p-6 sm:p-8 rounded-[28px] border border-slate-800 bg-slate-950/70 backdrop-blur-xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan Progress</p>
        <p className="text-lg font-bold text-slate-100 mt-2">{loan.loan_id}</p>
        <p className="text-sm text-slate-400 mt-1">Track verified payments, pending review, and the remaining balance in one place.</p>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 160 160" className="w-40 h-40 -rotate-90">
            <defs>
              <linearGradient id="paidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
              <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="remainingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r={radius} stroke="rgba(15, 23, 42, 0.9)" strokeWidth="14" fill="none" />
            <circle cx="80" cy="80" r={radius} stroke="url(#remainingGradient)" strokeWidth="14" strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={getOffset(remainingPercent)} opacity="0.35" />
            <circle cx="80" cy="80" r={radius - 18} stroke="rgba(15, 23, 42, 0.9)" strokeWidth="12" fill="none" />
            <circle cx="80" cy="80" r={radius - 18} stroke="url(#pendingGradient)" strokeWidth="12" strokeLinecap="round" fill="none" strokeDasharray={2 * Math.PI * (radius - 18)} strokeDashoffset={(2 * Math.PI * (radius - 18)) - ((pendingPercent / 100) * (2 * Math.PI * (radius - 18)))} opacity="0.85" />
            <circle cx="80" cy="80" r={radius - 36} stroke="rgba(15, 23, 42, 0.9)" strokeWidth="10" fill="none" />
            <circle cx="80" cy="80" r={radius - 36} stroke="url(#paidGradient)" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray={2 * Math.PI * (radius - 36)} strokeDashoffset={(2 * Math.PI * (radius - 36)) - ((paidPercent / 100) * (2 * Math.PI * (radius - 36)))} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Verified Paid</p>
            <p className="text-3xl font-black text-slate-50 mt-1">{paidPercent.toFixed(0)}%</p>
            <p className="text-xs text-slate-500 mt-1">of total payable</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 w-full">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">Verified Paid</p>
            <p className="mt-1 text-xl font-bold text-emerald-200">${formatCurrency(paid)}</p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/80">Pending Review</p>
            <p className="mt-1 text-xl font-bold text-cyan-100">${formatCurrency(normalizedPending)}</p>
          </div>
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-100/80">Remaining Balance</p>
            <p className="mt-1 text-xl font-bold text-indigo-100">${formatCurrency(remaining)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemberOverviewClient() {
  const { activeBulletin, loans, pendingPayments, pendingLoanRequests, summary } = useMemberWorkspace();
  const activeLoan = loans.find((loan) => loan.repayment_status !== 'paid') || null;
  const activeLoanPendingAmount = activeLoan
    ? pendingPayments
      .filter((payment) => payment.loan_id === activeLoan.loan_id)
      .reduce((sum, payment) => sum + Number.parseFloat(payment.amount_received || 0), 0)
    : 0;
  const bulletinMessage = activeBulletin?.message?.trim() || getDefaultBulletinMessage();

  return (
    <main className="relative flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <section className="grid xl:grid-cols-[1.35fr_0.95fr] gap-6 items-stretch">
        <div className="p-6 sm:p-8 rounded-[28px] border border-cyan-400/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_30px_120px_-40px_rgba(14,165,233,0.45)] space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-200 text-xs font-semibold uppercase tracking-[0.24em]">
            Admin Bulletin
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-50">Overview</h1>
            <p className="max-w-2xl text-slate-400 text-base md:text-lg leading-7 whitespace-pre-wrap">{bulletinMessage}</p>
          </div>
        </div>

        {activeLoan ? (
          <LoanProgressRing loan={activeLoan} pendingAmount={activeLoanPendingAmount} />
        ) : (
          <div className="p-6 sm:p-8 rounded-[28px] border border-slate-800 bg-slate-950/70 backdrop-blur-xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan Status</p>
            <p className="text-2xl font-bold text-slate-100">No active loan in progress</p>
            <p className="text-sm text-slate-400 leading-6">
              {pendingLoanRequests.length
                ? 'You already have a pending loan request waiting for admin review.'
                : 'You can use the Loan Request tab to ask for a new loan when you are ready.'}
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/50 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Outstanding Balance</p>
          <p className="text-3xl font-bold text-emerald-300 mt-3">${formatCurrency(summary.total_balance)}</p>
          <p className="text-sm text-slate-500 mt-2">Approved balance still due</p>
        </div>
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/50 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Payable</p>
          <p className="text-3xl font-bold text-indigo-200 mt-3">${formatCurrency(summary.total_payable)}</p>
          <p className="text-sm text-slate-500 mt-2">Across all configured loans</p>
        </div>
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/50 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Approved Payments</p>
          <p className="text-3xl font-bold text-sky-200 mt-3">{summary.approved_count}</p>
          <p className="text-sm text-slate-500 mt-2">Verified by admin</p>
        </div>
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/50 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Loan Accounts</p>
          <p className="text-3xl font-bold text-slate-100 mt-3">{summary.total_loans}</p>
          <p className="text-sm text-slate-500 mt-2">Tracked inside this portal</p>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1.3fr_1fr] gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-100">Loan Accounts</h2>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Live summary</span>
          </div>
          <div className="border border-slate-900 rounded-[28px] bg-slate-950/80 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                  <tr>
                    <th className="px-6 py-4">Loan ID</th>
                    <th className="px-6 py-4">Principal</th>
                    <th className="px-6 py-4">Term</th>
                    <th className="px-6 py-4">Outstanding</th>
                    <th className="px-6 py-4">Release Date</th>
                    <th className="px-6 py-4 text-center">Repayment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-sm">
                        No loan accounts are linked to this member.
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => (
                      <tr key={loan.loan_id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-slate-100">{loan.loan_id}</td>
                        <td className="px-6 py-4">${formatCurrency(loan.principal_amount)}</td>
                        <td className="px-6 py-4">{loan.term_months} mos</td>
                        <td className="px-6 py-4 text-emerald-300 font-medium">${formatCurrency(loan.balance)}</td>
                        <td className="px-6 py-4 text-slate-400">{loan.release_date}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRepaymentStatusClass(loan.repayment_status)}`}>
                            {formatRepaymentStatus(loan.repayment_status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-900 md:hidden">
              {loans.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-500 text-sm">
                  No loan accounts are linked to this member.
                </div>
              ) : (
                loans.map((loan) => (
                  <article key={loan.loan_id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-slate-100">{loan.loan_id}</p>
                        <p className="text-xs text-slate-500">Released on {loan.release_date}</p>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRepaymentStatusClass(loan.repayment_status)}`}>
                        {formatRepaymentStatus(loan.repayment_status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Principal</p>
                        <p className="mt-2 font-semibold text-slate-100">${formatCurrency(loan.principal_amount)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Outstanding</p>
                        <p className="mt-2 font-semibold text-emerald-300">${formatCurrency(loan.balance)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">Term: {loan.term_months} months</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-100">Pending Approval</h2>
            <span className="text-xs uppercase tracking-[0.24em] text-cyan-300">Payment must be reviewed by admin manually</span>
          </div>
          <div className="rounded-[28px] border border-cyan-400/10 bg-slate-950/70 overflow-hidden">
            <div className="p-5 border-b border-slate-900/80 bg-slate-900/50">
              <p className="text-sm text-slate-400">These submissions are recorded but not deducted from your balance until an admin approves them.</p>
            </div>
            <div className="divide-y divide-slate-900">
              {pendingPayments.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No payments are waiting for review right now.
                </div>
              ) : (
                pendingPayments.map((payment) => (
                  <div key={payment.payment_id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{payment.loan_id}</p>
                        <p className="text-xs text-slate-500">Submitted on {payment.payment_date}</p>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRecordStatusClass(payment.record_status)}`}>
                        {formatRecordStatus(payment.record_status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-xs uppercase tracking-wider text-slate-500">Amount</p>
                        <p className="text-lg font-bold text-cyan-200 mt-1">${formatCurrency(payment.amount_received)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-xs uppercase tracking-wider text-slate-500">Method</p>
                        <p className="text-lg font-bold text-slate-100 mt-1 uppercase">{payment.payment_method}</p>
                      </div>
                    </div>
                    {payment.reference_code && (
                      <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100">
                        Reference code: <span className="font-mono">{payment.reference_code}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}