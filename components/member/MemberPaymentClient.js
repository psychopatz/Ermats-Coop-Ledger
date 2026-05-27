'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberWorkspace } from '@/components/member/MemberWorkspaceProvider';
import { formatCurrency } from '@/components/member/memberUi';
import {
  memberFieldClassName,
  memberHeroPanelClassName,
  memberInfoCardClassName,
  memberPageClassName,
  memberPrimaryButtonClassName,
  memberSectionEyebrowClassName,
} from '@/components/member/memberTheme';
import PendingPaymentsPanel from '@/components/member/payment/PendingPaymentsPanel';
import ReceiptPreviewCard from '@/components/member/payment/ReceiptPreviewCard';
import ReceiptPreviewModal from '@/components/member/payment/ReceiptPreviewModal';
import { createPaymentForm, revokeReceiptPreview, scanReceiptForReference } from '@/components/member/payment/paymentPreviewUtils';
import { createOptimisticId } from '@/lib/domain/workspaceState';

export default function MemberPaymentClient() {
  const { availableLoans, pendingPayments, today, syncStatus, dispatch } = useMemberWorkspace();
  const router = useRouter();
  const ocrInputRef = useRef(null);
  const receiptPreviewRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [ocrMessage, setOcrMessage] = useState('');
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [paymentForm, setPaymentForm] = useState(() => createPaymentForm(today, availableLoans[0]?.loan_id));

  const selectedLoan = availableLoans.find((loan) => loan.loan_id === paymentForm.loan_id);
  const isBusy = isSubmitting || isRunningOcr || syncStatus.state === 'saving';

  useEffect(() => {
    receiptPreviewRef.current = receiptPreview;
  }, [receiptPreview]);

  useEffect(() => {
    return () => {
      revokeReceiptPreview(receiptPreviewRef.current);
    };
  }, []);

  const clearReceiptPreview = () => {
    revokeReceiptPreview(receiptPreviewRef.current);
    receiptPreviewRef.current = null;
    setReceiptPreview(null);
    setIsPreviewOpen(false);
  };

  const replaceReceiptPreview = (preview) => {
    revokeReceiptPreview(receiptPreviewRef.current);
    receiptPreviewRef.current = preview;
    setReceiptPreview(preview);
  };

  const setPaymentMethod = (paymentMethod) => {
    setError('');
    setOcrMessage('');

    if (paymentMethod !== 'gcash') {
      clearReceiptPreview();
    }

    setPaymentForm((current) => ({
      ...current,
      payment_method: paymentMethod,
      reference_code: paymentMethod === 'gcash' ? current.reference_code : '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedLoan) {
      setError('Please select a valid loan account.');
      return;
    }

    const amount = Number.parseFloat(paymentForm.amount_received);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    const normalizedReferenceCode = paymentForm.payment_method === 'gcash'
      ? paymentForm.reference_code.trim()
      : '';
    if (paymentForm.payment_method === 'gcash' && !normalizedReferenceCode) {
      setError('GCash payments require a reference code.');
      return;
    }

    const optimisticId = createOptimisticId('member-payment');
    const now = new Date().toISOString();

    dispatch({
      type: 'payment_submit_started',
      payload: {
        payment: {
          payment_id: optimisticId,
          loan_id: paymentForm.loan_id,
          member_id: selectedLoan.member_id,
          payment_date: paymentForm.payment_date,
          amount_received: amount,
          received_by: '',
          status: 'pending_approval',
          created_at: now,
          updated_at: now,
          payment_method: paymentForm.payment_method,
          reference_code: normalizedReferenceCode,
        },
      },
    });

    setError('');
    setOcrMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/member/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: paymentForm.loan_id,
          amount_received: amount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference_code: normalizedReferenceCode,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        dispatch({
          type: 'payment_submit_failed',
          payload: {
            tempId: optimisticId,
            message: 'Your member session expired. Please sign in again.',
          },
        });
        router.push('/member-login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit payment.');
      }

      dispatch({
        type: 'payment_submit_succeeded',
        payload: {
          tempId: optimisticId,
          payment: data,
        },
      });

      if (paymentForm.payment_method === 'gcash') {
        clearReceiptPreview();
      }

      setPaymentForm({
        ...createPaymentForm(today, paymentForm.loan_id || availableLoans[0]?.loan_id),
        payment_method: paymentForm.payment_method,
      });
    } catch (requestError) {
      const message = requestError.message || 'Failed to submit payment.';
      dispatch({
        type: 'payment_submit_failed',
        payload: {
          tempId: optimisticId,
          message,
        },
      });
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOcrFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');
    setOcrMessage('Reading receipt locally in your browser...');
    setIsRunningOcr(true);

    try {
      const preview = await scanReceiptForReference(file);

      replaceReceiptPreview(preview);
      setIsPreviewOpen(true);

      if (!preview.extractedCode) {
        throw new Error('No GCash reference number was detected. You can still type it manually while comparing the receipt preview.');
      }

      setPaymentForm((current) => ({
        ...current,
        reference_code: preview.extractedCode,
      }));
      setOcrMessage(`Reference code extracted locally: ${preview.extractedCode}. Open the fullscreen preview to inspect the receipt and compare it with the input.`);
    } catch (ocrError) {
      setError(ocrError.message || 'Failed to read the receipt image.');
      setOcrMessage('');
    } finally {
      setIsRunningOcr(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <>
      <main className={memberPageClassName}>
        <section className="grid xl:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className={memberHeroPanelClassName}>
            <div className="pointer-events-none absolute -top-8 right-0 h-32 w-32 rounded-full bg-emerald-200/8 blur-3xl" />
            <div className="space-y-3 relative z-10">
              <p className={memberSectionEyebrowClassName}>Payment Submission</p>
              <h1 className="text-4xl font-black tracking-tight text-slate-50">Submit a payment and keep the proof ready.</h1>
              <p className="text-slate-300/80 leading-7 max-w-2xl">
                Member-submitted payments are stored immediately in your ledger timeline, but they stay in pending review until an admin verifies the remittance. For GCash, the reference code and receipt preview help both sides compare the same receipt faster.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
                {error}
              </div>
            )}

            {ocrMessage && !error && (
              <div className="p-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-stone-100 text-sm">
                {ocrMessage}
              </div>
            )}

            {syncStatus.state !== 'idle' && !error && (
              <div className={`p-4 rounded-2xl text-sm border ${
                syncStatus.state === 'saved'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                  : syncStatus.state === 'error'
                    ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                    : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100'
              }`}>
                {syncStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Loan Account</span>
                  <select
                    required
                    value={paymentForm.loan_id}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, loan_id: event.target.value }))}
                    disabled={isBusy}
                    className={memberFieldClassName}
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
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    disabled={isBusy}
                    className={memberFieldClassName}
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
                    onChange={(event) => setPaymentForm((current) => ({ ...current, amount_received: event.target.value }))}
                    disabled={isBusy}
                    placeholder="550.00"
                    className={memberFieldClassName}
                  />
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payment Date</span>
                  <input
                    type="date"
                    required
                    value={paymentForm.payment_date}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, payment_date: event.target.value }))}
                    disabled={isBusy}
                    className={memberFieldClassName}
                  />
                </label>
              </div>

              {paymentForm.payment_method === 'gcash' && (
                <label className="space-y-3 text-sm block">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reference Code</span>
                  <input
                    ref={ocrInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleOcrFileChange}
                    className="hidden"
                  />
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      required
                      value={paymentForm.reference_code}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, reference_code: event.target.value }))}
                      disabled={isBusy}
                      placeholder="Example: 2045 667 982375"
                      className={memberFieldClassName}
                    />
                    <button
                      type="button"
                      onClick={() => ocrInputRef.current?.click()}
                      disabled={isBusy}
                      className="rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-stone-100 hover:bg-white/12 transition-colors text-sm font-semibold disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      {isRunningOcr ? 'Scanning Locally...' : 'Scan GCash Screenshot'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-5">
                    OCR stays local in your browser. The portal will also create a focused receipt preview around the detected reference region when possible.
                  </p>
                  {receiptPreview && (
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-stone-100 hover:bg-white/12 cursor-pointer"
                    >
                      Open Fullscreen Receipt Preview
                    </button>
                  )}
                </label>
              )}

              <button
                type="submit"
                disabled={isBusy || !availableLoans.length}
                className={memberPrimaryButtonClassName}
              >
                {isBusy ? 'Submitting...' : 'Submit Payment for Review'}
              </button>
            </form>
          </div>

          <div className="space-y-5">
            <div className={memberInfoCardClassName}>
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

            <div className={memberInfoCardClassName}>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300">GCash verification tip</p>
              <p className="text-sm text-slate-200 leading-6">
                Match the receipt reference number from your GCash history. Admin approval is manual so false flags do not reduce the official ledger balance.
              </p>
            </div>

            <ReceiptPreviewCard
              preview={receiptPreview}
              referenceCode={paymentForm.reference_code}
              onOpen={() => setIsPreviewOpen(true)}
              onClear={clearReceiptPreview}
            />
          </div>
        </section>

        <PendingPaymentsPanel pendingPayments={pendingPayments} />
      </main>

      <ReceiptPreviewModal
        isOpen={isPreviewOpen}
        preview={receiptPreview}
        referenceCode={paymentForm.reference_code}
        onReferenceCodeChange={(value) => setPaymentForm((current) => ({ ...current, reference_code: value }))}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
