'use client';

import { useMemberWorkspace } from '@/components/member/MemberWorkspaceProvider';
import {
  formatCurrency,
  formatRecordStatus,
  formatRepaymentStatus,
  getRecordStatusClass,
  getRepaymentStatusClass,
} from '@/components/member/memberUi';

export default function MemberOverviewClient() {
  const { loans, pendingPayments, summary } = useMemberWorkspace();

  return (
    <main className="relative flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <section className="grid xl:grid-cols-[1.35fr_0.95fr] gap-6 items-stretch">
        <div className="p-6 sm:p-8 rounded-[28px] border border-cyan-400/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_30px_120px_-40px_rgba(14,165,233,0.45)] space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-200 text-xs font-semibold uppercase tracking-[0.24em]">
            Overview
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-50">
              Stay on top of every balance and every pending approval.
            </h1>
            <p className="max-w-2xl text-slate-400 text-base md:text-lg leading-7">
              Your portal now separates approved collections from pending submissions so GCash receipts can be checked by admin before they affect your outstanding balance.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-[28px] border border-slate-800 bg-slate-950/70 backdrop-blur-xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pending Review Snapshot</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <p className="text-xs uppercase tracking-wider text-slate-500">Submissions</p>
              <p className="text-3xl font-bold text-cyan-200 mt-2">{summary.pending_count}</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <p className="text-xs uppercase tracking-wider text-slate-500">Awaiting Amount</p>
              <p className="text-3xl font-bold text-cyan-200 mt-2">${formatCurrency(summary.pending_amount)}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-6">
            Pending payments are visible immediately in your portal, but they do not reduce the official balance until the admin verifies the remittance.
          </p>
        </div>
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
            <span className="text-xs uppercase tracking-[0.24em] text-cyan-300">GCash reviewed manually</span>
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