'use client';

import { formatCurrency, formatRecordStatus, getRecordStatusClass } from '@/components/member/memberUi';
import { memberTableCardClassName } from '@/components/member/memberTheme';

export default function PendingPaymentsPanel({ pendingPayments }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Pending Submissions</h2>
        <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Visible immediately after submit</span>
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
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {pendingPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 text-sm">
                    You do not have any pending payment submissions.
                  </td>
                </tr>
              ) : (
                pendingPayments.map((payment) => (
                  <tr key={payment.payment_id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-100">{payment.payment_id}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{payment.loan_id}</td>
                    <td className="px-6 py-4 text-slate-400">{payment.payment_date}</td>
                    <td className="px-6 py-4 font-medium text-cyan-200">${formatCurrency(payment.amount_received)}</td>
                    <td className="px-6 py-4 uppercase">{payment.payment_method}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{payment.reference_code || 'N/A'}</td>
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
          {pendingPayments.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">
              You do not have any pending payment submissions.
            </div>
          ) : (
            pendingPayments.map((payment) => (
              <article key={payment.payment_id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-100">{payment.payment_id}</p>
                    <p className="text-xs text-slate-500">{payment.loan_id}</p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRecordStatusClass(payment.record_status)}`}>
                    {formatRecordStatus(payment.record_status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Amount</p>
                    <p className="mt-2 font-semibold text-cyan-200">${formatCurrency(payment.amount_received)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Method</p>
                    <p className="mt-2 font-semibold uppercase text-slate-100">{payment.payment_method}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-slate-400">
                  <p>Date: {payment.payment_date}</p>
                  <p>Reference: {payment.reference_code || 'N/A'}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}