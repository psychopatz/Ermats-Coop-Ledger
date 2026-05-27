'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberWorkspace } from '@/components/member/MemberWorkspaceProvider';
import { formatCurrency, formatRecordStatus, getRecordStatusClass } from '@/components/member/memberUi';

function createPaymentForm(today, defaultLoanId) {
  return {
    loan_id: defaultLoanId || '',
    amount_received: '',
    payment_date: today,
    payment_method: 'gcash',
    reference_code: '',
  };
}

export default function MemberPaymentClient() {
  const { availableLoans, pendingPayments, today } = useMemberWorkspace();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentForm, setPaymentForm] = useState(() => createPaymentForm(today, availableLoans[0]?.loan_id));

  const selectedLoan = useMemo(
    () => availableLoans.find((loan) => loan.loan_id === paymentForm.loan_id),
    [availableLoans, paymentForm.loan_id]
  );
  const isBusy = isPending || isSubmitting;

  const refreshWorkspace = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/member/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: paymentForm.loan_id,
          amount_received: Number.parseFloat(paymentForm.amount_received),
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference_code: paymentForm.reference_code,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push('/member-login');
        refreshWorkspace();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit payment.');
      }

      setSuccessMessage('Payment submitted. It will appear as pending until an admin confirms it.');
      setPaymentForm(createPaymentForm(today, paymentForm.loan_id || availableLoans[0]?.loan_id));
      refreshWorkspace();
    } catch (requestError) {
      setError(requestError.message || 'Failed to submit payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <section className="grid xl:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="p-8 rounded-[30px] border border-cyan-400/10 bg-slate-950/70 backdrop-blur-xl space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-200 text-xs font-semibold uppercase tracking-[0.24em]">
              Payment Submission
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-50">Submit a payment and keep the proof ready.</h1>
            <p className="text-slate-400 leading-7 max-w-2xl">
              Member-submitted payments are stored immediately in your ledger timeline, but they stay in pending review until an admin verifies the remittance. For GCash, the reference code helps prevent false approvals.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Loan Account</span>
                <select
                  required
                  value={paymentForm.loan_id}
                  onChange={(event) => setPaymentForm({ ...paymentForm, loan_id: event.target.value })}
                  disabled={isBusy}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Select Loan...</option>
                  {availableLoans.map((loan) => (
                    <option key={loan.loan_id} value={loan.loan_id}>
                      {loan.loan_id} (${formatCurrency(loan.balance)} remaining)
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payment Method</span>
                <select
                  value={paymentForm.payment_method}
                  onChange={(event) => setPaymentForm({ ...paymentForm, payment_method: event.target.value })}
                  disabled={isBusy}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="gcash">GCash</option>
                  <option value="cash">Cash</option>
                </select>
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={paymentForm.amount_received}
                  onChange={(event) => setPaymentForm({ ...paymentForm, amount_received: event.target.value })}
                  disabled={isBusy}
                  placeholder="550.00"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payment Date</span>
                <input
                  type="date"
                  required
                  value={paymentForm.payment_date}
                  onChange={(event) => setPaymentForm({ ...paymentForm, payment_date: event.target.value })}
                  disabled={isBusy}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <label className="space-y-1.5 text-sm block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reference Code</span>
              <input
                type="text"
                value={paymentForm.reference_code}
                onChange={(event) => setPaymentForm({ ...paymentForm, reference_code: event.target.value })}
                disabled={isBusy}
                placeholder={paymentForm.payment_method === 'gcash' ? 'Example: 2045 667 982375' : 'Optional for cash receipts'}
                className="w-full px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <p className="text-xs text-slate-500 leading-5">
                {paymentForm.payment_method === 'gcash'
                  ? 'Copy the reference number from your GCash receipt so the admin can verify it manually.'
                  : 'If you received a written cash acknowledgment, you can store it here for your own tracking.'}
              </p>
            </label>

            <button
              type="submit"
              disabled={isBusy || !availableLoans.length}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isBusy ? 'Submitting...' : 'Submit Payment for Review'}
            </button>
          </form>
        </div>

        <div className="space-y-5">
          <div className="p-6 rounded-[30px] border border-slate-900 bg-slate-950/70 space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected Loan</p>
            {selectedLoan ? (
              <>
                <p className="text-2xl font-bold text-slate-100">{selectedLoan.loan_id}</p>
                <p className="text-sm text-slate-400">Outstanding balance</p>
                <p className="text-4xl font-black text-emerald-300">${formatCurrency(selectedLoan.balance)}</p>
              </>
            ) : (
              <p className="text-sm text-slate-500">Choose a loan account to see the remaining balance.</p>
            )}
          </div>

          <div className="p-6 rounded-[30px] border border-cyan-400/10 bg-cyan-400/5 space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">GCash verification tip</p>
            <p className="text-sm text-cyan-50 leading-6">
              Match the receipt reference number from your GCash history. Admin approval is manual so false flags do not reduce the official ledger balance.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-100">Pending Submissions</h2>
          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Visible immediately after submit</span>
        </div>
        <div className="border border-slate-900 rounded-[28px] bg-slate-950/80 overflow-hidden">
          <div className="overflow-x-auto">
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
        </div>
      </section>
    </main>
  );
}