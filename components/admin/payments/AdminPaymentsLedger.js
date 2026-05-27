import { parseAmount } from '@/lib/domain/payments';
import { portalTableCardClassName } from '@/components/theme/portalTheme';
import {
  formatRecordStatus,
  formatRepaymentStatus,
  formatCurrency,
  getRecordStatusClass,
  getRepaymentStatusClass,
} from '@/components/admin/payments/paymentUi';

export default function AdminPaymentsLedger({
  payments,
  memberLookup,
  isBusy,
  onApprovePayment,
  onStartVoid,
}) {
  return (
    <div className={portalTableCardClassName}>
      <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/40">
        <h3 className="text-lg font-bold text-slate-100">Payment Ledger</h3>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
            <tr>
              <th className="px-5 py-3">Payment ID</th>
              <th className="px-5 py-3">Borrower</th>
              <th className="px-5 py-3">Loan ID</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Reference Code</th>
              <th className="px-5 py-3">Repayment</th>
              <th className="px-5 py-3">Record</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-5 py-8 text-center text-slate-500 text-sm">
                  No payments match the current filters.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const borrower = memberLookup.get(payment.member_id);

                return (
                  <tr key={payment.payment_id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-200 text-xs">{payment.payment_id}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-300">
                      <p className="font-semibold">{borrower?.full_name || payment.member_id}</p>
                      <p className="text-[10px] text-slate-500">{payment.member_id}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">{payment.loan_id}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{payment.payment_date}</td>
                    <td className="px-5 py-3.5 font-medium text-xs">{formatCurrency(payment.amount_received)}</td>
                    <td className="px-5 py-3.5 text-xs uppercase text-slate-300">{payment.payment_method}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{payment.reference_code || 'N/A'}</td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRepaymentStatusClass(payment.repayment_status)}`}>
                        {formatRepaymentStatus(payment.repayment_status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRecordStatusClass(payment.record_status)}`}>
                        {formatRecordStatus(payment.record_status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {payment.record_status === 'pending_approval' && (
                          <button
                            onClick={() => onApprovePayment(payment.payment_id)}
                            disabled={isBusy}
                            className="text-xs text-cyan-300 hover:text-cyan-200 font-semibold disabled:opacity-50 cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {payment.record_status !== 'voided' && (
                          <button
                            onClick={() => onStartVoid(payment.payment_id)}
                            disabled={isBusy}
                            className="text-xs text-rose-500 hover:text-rose-400 font-semibold disabled:opacity-50 cursor-pointer"
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-900 md:hidden">
        {payments.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500 text-sm">
            No payments match the current filters.
          </div>
        ) : (
          payments.map((payment) => {
            const borrower = memberLookup.get(payment.member_id);

            return (
              <article key={payment.payment_id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-100">{payment.payment_id}</p>
                    <p className="text-sm text-slate-300">{borrower?.full_name || payment.member_id}</p>
                    <p className="text-xs text-slate-500">{payment.loan_id} • {payment.payment_date}</p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRecordStatusClass(payment.record_status)}`}>
                    {formatRecordStatus(payment.record_status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Amount</p>
                    <p className="mt-2 font-semibold text-emerald-300">{formatCurrency(payment.amount_received)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Method</p>
                    <p className="mt-2 font-semibold uppercase text-slate-100">{payment.payment_method}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-slate-400">
                  <p>Reference: {payment.reference_code || 'N/A'}</p>
                  <p>Repayment: {formatRepaymentStatus(payment.repayment_status)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {payment.record_status === 'pending_approval' && (
                    <button
                      onClick={() => onApprovePayment(payment.payment_id)}
                      disabled={isBusy}
                      className="text-sm text-cyan-300 hover:text-cyan-200 font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      Approve
                    </button>
                  )}
                  {payment.record_status !== 'voided' && (
                    <button
                      onClick={() => onStartVoid(payment.payment_id)}
                      disabled={isBusy}
                      className="text-sm text-rose-500 hover:text-rose-400 font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      Void
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}