import { getPortalSyncMessageClassName, portalMetricCardClassName } from '@/components/theme/portalTheme';
import { formatCurrency } from '@/components/admin/payments/paymentUi';

export default function AdminPaymentsOverview({
  visiblePaymentCount,
  collectedAmount,
  pendingCount,
  pendingAmount,
  voidedCount,
  error,
  syncStatus,
}) {
  return (
    <>
      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <div className={portalMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visible Payments</p>
          <p className="text-3xl font-bold text-slate-100 mt-2">{visiblePaymentCount}</p>
          <p className="text-xs text-slate-500 mt-2">Filtered by your current controls</p>
        </div>
        <div className={portalMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved Amount</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{formatCurrency(collectedAmount)}</p>
          <p className="text-xs text-slate-500 mt-2">Already reflected in official balances</p>
        </div>
        <div className={portalMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Approval</p>
          <p className="text-3xl font-bold text-cyan-200 mt-2">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-2">{formatCurrency(pendingAmount)} waiting for review</p>
        </div>
        <div className={portalMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Voided Entries</p>
          <p className="text-3xl font-bold text-rose-400 mt-2">{voidedCount}</p>
          <p className="text-xs text-slate-500 mt-2">Transactions reversed from the ledger</p>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex gap-3 items-center">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {syncStatus.state !== 'idle' && !error && (
        <div className={`p-4 rounded-xl text-sm border ${getPortalSyncMessageClassName(syncStatus.state)}`}>
          {syncStatus.message}
        </div>
      )}
    </>
  );
}