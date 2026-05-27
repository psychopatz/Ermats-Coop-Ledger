import { parseAmount } from '@/lib/domain/payments';
import { formatCurrency } from '@/components/admin/payments/paymentUi';
import {
  portalFieldClassName,
  portalFormCardClassName,
  portalPrimaryButtonClassName,
} from '@/components/theme/portalTheme';

export function AdminPaymentRecordForm({
  paymentForm,
  loans,
  memberLookup,
  isBusy,
  onSubmit,
  onFieldChange,
  onPaymentMethodChange,
}) {
  return (
    <form onSubmit={onSubmit} className={portalFormCardClassName}>
      <div>
        <h3 className="text-xl font-bold text-slate-100">Record Payment</h3>
        <p className="text-sm text-slate-400 mt-1">Store the payment method and keep the repayment status derived from the linked loan balance.</p>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Loan</label>
        <select
          required
          value={paymentForm.loan_id}
          onChange={(event) => onFieldChange('loan_id', event.target.value)}
          className={portalFieldClassName}
        >
          <option value="">Select Loan...</option>
          {loans
            .filter((loan) => loan.repayment_status !== 'paid')
            .map((loan) => (
              <option key={loan.loan_id} value={loan.loan_id}>
                {loan.loan_id} - {(memberLookup.get(loan.member_id)?.full_name || loan.member_id)} ({formatCurrency(loan.balance)} bal)
              </option>
            ))}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amount Received (₱)</label>
          <input
            type="number"
            required
            min="1"
            step="any"
            value={paymentForm.amount_received}
            onChange={(event) => onFieldChange('amount_received', event.target.value)}
            placeholder="1000"
            disabled={isBusy}
            className={portalFieldClassName}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Date</label>
          <input
            type="date"
            required
            value={paymentForm.payment_date}
            onChange={(event) => onFieldChange('payment_date', event.target.value)}
            disabled={isBusy}
            className={portalFieldClassName}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Method</label>
        <select
          value={paymentForm.payment_method}
          onChange={(event) => onPaymentMethodChange(event.target.value)}
          disabled={isBusy}
          className={portalFieldClassName}
        >
          <option value="cash">Cash</option>
          <option value="gcash">GCash</option>
        </select>
      </div>
      {paymentForm.payment_method === 'gcash' && (
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reference Code</label>
          <input
            type="text"
            required
            value={paymentForm.reference_code}
            onChange={(event) => onFieldChange('reference_code', event.target.value)}
            disabled={isBusy}
            placeholder="Example: 2045 667 982375"
            className={portalFieldClassName}
          />
          <p className="text-xs text-slate-500">Required for GCash verification.</p>
        </div>
      )}
      <button type="submit" disabled={isBusy} className={portalPrimaryButtonClassName}>
        {isBusy ? 'Processing...' : 'Record Payment'}
      </button>
    </form>
  );
}

export function AdminPaymentVoidForm({
  paymentId,
  voidReason,
  isBusy,
  onSubmit,
  onCancel,
  onVoidReasonChange,
}) {
  return (
    <form onSubmit={onSubmit} className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-rose-400">Void Payment</h3>
          <p className="text-xs text-slate-500 mt-1">Selected payment: {paymentId}</p>
        </div>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-100 cursor-pointer">
          Cancel
        </button>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Void Reason</label>
        <input
          type="text"
          required
          value={voidReason}
          onChange={(event) => onVoidReasonChange(event.target.value)}
          placeholder="Incorrect entry"
          disabled={isBusy}
          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-rose-500"
        />
      </div>
      <button
        type="submit"
        disabled={isBusy}
        className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all disabled:opacity-50 text-sm cursor-pointer"
      >
        {isBusy ? 'Voiding...' : 'Confirm Void'}
      </button>
    </form>
  );
}