import {
  portalFieldClassName,
  portalFormCardClassName,
  portalTableCardClassName,
} from '@/components/theme/portalTheme';
import { formatCurrency } from '@/components/admin/payments/paymentUi';

export default function AdminPaymentsAnalyticsPanel({
  groupBy,
  paymentMethodFilter,
  repaymentStatusFilter,
  recordStatusFilter,
  groupedPayments,
  onGroupByChange,
  onPaymentMethodFilterChange,
  onRepaymentStatusFilterChange,
  onRecordStatusFilterChange,
}) {
  return (
    <>
      <div className={portalFormCardClassName}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Payments Analytics</h2>
            <p className="text-sm text-slate-400">Group collections by year, month, or ISO week while keeping repayment and record status visible.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Group By</span>
            <select value={groupBy} onChange={(event) => onGroupByChange(event.target.value)} className={portalFieldClassName}>
              <option value="year">Year</option>
              <option value="month">Month</option>
              <option value="week">Week</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Method</span>
            <select
              value={paymentMethodFilter}
              onChange={(event) => onPaymentMethodFilterChange(event.target.value)}
              className={portalFieldClassName}
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Repayment Status</span>
            <select
              value={repaymentStatusFilter}
              onChange={(event) => onRepaymentStatusFilterChange(event.target.value)}
              className={portalFieldClassName}
            >
              <option value="all">All Repayments</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="not_paid">Not Paid</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Record Status</span>
            <select
              value={recordStatusFilter}
              onChange={(event) => onRecordStatusFilterChange(event.target.value)}
              className={portalFieldClassName}
            >
              <option value="all">All Records</option>
              <option value="approved">Approved</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="voided">Voided</option>
            </select>
          </label>
        </div>
      </div>

      <div className={portalTableCardClassName}>
        <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100">Grouped Totals</h3>
          <span className="text-xs uppercase tracking-wider text-slate-500">{groupBy} buckets</span>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
              <tr>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Payments</th>
                <th className="px-5 py-3">Total Amount</th>
                <th className="px-5 py-3">Cash</th>
                <th className="px-5 py-3">GCash</th>
                <th className="px-5 py-3">Approved</th>
                <th className="px-5 py-3">Pending</th>
                <th className="px-5 py-3">Voided</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {groupedPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-500 text-sm">
                    No payments match the current filters.
                  </td>
                </tr>
              ) : (
                groupedPayments.map((group) => (
                  <tr key={group.period} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-200">{group.period}</td>
                    <td className="px-5 py-3.5">{group.payment_count}</td>
                    <td className="px-5 py-3.5 font-medium text-emerald-400">{formatCurrency(group.total_amount)}</td>
                    <td className="px-5 py-3.5">{group.cash_count}</td>
                    <td className="px-5 py-3.5">{group.gcash_count}</td>
                    <td className="px-5 py-3.5">{group.approved_count}</td>
                    <td className="px-5 py-3.5">{group.pending_count}</td>
                    <td className="px-5 py-3.5">{group.voided_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-slate-900 md:hidden">
          {groupedPayments.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">
              No payments match the current filters.
            </div>
          ) : (
            groupedPayments.map((group) => (
              <article key={group.period} className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-sm font-semibold text-slate-100">{group.period}</p>
                  <p className="text-sm font-semibold text-emerald-400">{formatCurrency(group.total_amount)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/8 bg-white/6 p-3">Payments: {group.payment_count}</div>
                  <div className="rounded-2xl border border-white/8 bg-white/6 p-3">Approved: {group.approved_count}</div>
                  <div className="rounded-2xl border border-white/8 bg-white/6 p-3">Pending: {group.pending_count}</div>
                  <div className="rounded-2xl border border-white/8 bg-white/6 p-3">Voided: {group.voided_count}</div>
                  <div className="rounded-2xl border border-white/8 bg-white/6 p-3">Cash: {group.cash_count}</div>
                  <div className="rounded-2xl border border-white/8 bg-white/6 p-3">GCash: {group.gcash_count}</div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </>
  );
}