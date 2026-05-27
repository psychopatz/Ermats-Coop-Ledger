'use client';

import { useMemberWorkspace } from '@/components/member/MemberWorkspaceProvider';
import {
  formatCurrency,
  formatRecordStatus,
  formatRepaymentStatus,
  getRecordStatusClass,
  getRepaymentStatusClass,
} from '@/components/member/memberUi';
import {
  memberMetricCardClassName,
  memberPageClassName,
  memberTableCardClassName,
} from '@/components/member/memberTheme';

export default function MemberPaymentHistoryClient() {
  const { payments, summary } = useMemberWorkspace();

  return (
    <main className={memberPageClassName}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Approved Amount</p>
          <p className="text-3xl font-bold text-emerald-300 mt-3">${formatCurrency(summary.approved_amount)}</p>
          <p className="text-sm text-slate-500 mt-2">Already reflected in your official balance</p>
        </div>
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending Count</p>
          <p className="text-3xl font-bold text-cyan-200 mt-3">{summary.pending_count}</p>
          <p className="text-sm text-slate-500 mt-2">Awaiting admin review</p>
        </div>
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Voided Entries</p>
          <p className="text-3xl font-bold text-rose-300 mt-3">{summary.voided_count}</p>
          <p className="text-sm text-slate-500 mt-2">Rejected or reversed payment records</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-50">Payment History</h1>
            <p className="text-slate-400 mt-2">Review every approved, pending, and voided payment with its method and reference code.</p>
          </div>
        </div>
        <div className={memberTableCardClassName}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                <tr>
                  <th className="px-6 py-4">Payment ID</th>
                  <th className="px-6 py-4">Loan ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Reference Code</th>
                  <th className="px-6 py-4">Collector</th>
                  <th className="px-6 py-4 text-center">Repayment</th>
                  <th className="px-6 py-4 text-center">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-slate-500 text-sm">
                      No payment activity has been recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.payment_id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-100">{payment.payment_id}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{payment.loan_id}</td>
                      <td className="px-6 py-4 text-slate-400">{payment.payment_date}</td>
                      <td className="px-6 py-4 font-medium">${formatCurrency(payment.amount_received)}</td>
                      <td className="px-6 py-4 uppercase">{payment.payment_method}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{payment.reference_code || 'N/A'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{payment.received_by || 'Awaiting review'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRepaymentStatusClass(payment.repayment_status)}`}>
                          {formatRepaymentStatus(payment.repayment_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRecordStatusClass(payment.record_status)}`}>
                          {formatRecordStatus(payment.record_status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-900 md:hidden">
            {payments.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500 text-sm">
                No payment activity has been recorded yet.
              </div>
            ) : (
              payments.map((payment) => (
                <article key={payment.payment_id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-100">{payment.payment_id}</p>
                      <p className="text-xs text-slate-500">{payment.loan_id} • {payment.payment_date}</p>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRecordStatusClass(payment.record_status)}`}>
                      {formatRecordStatus(payment.record_status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Amount</p>
                      <p className="mt-2 font-semibold text-slate-100">${formatCurrency(payment.amount_received)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Method</p>
                      <p className="mt-2 font-semibold uppercase text-slate-100">{payment.payment_method}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-slate-400">
                    <p>Reference: {payment.reference_code || 'N/A'}</p>
                    <p>Collector: {payment.received_by || 'Awaiting review'}</p>
                    <p>Repayment: {formatRepaymentStatus(payment.repayment_status)}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}