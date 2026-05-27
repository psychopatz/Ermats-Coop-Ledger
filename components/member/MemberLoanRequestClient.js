'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberWorkspace } from '@/components/member/MemberWorkspaceProvider';
import { formatCurrency } from '@/components/member/memberUi';
import {
  memberFieldClassName,
  memberHeroPanelClassName,
  memberInfoCardClassName,
  memberMetricCardClassName,
  memberPageClassName,
  memberPrimaryButtonClassName,
  memberTableCardClassName,
} from '@/components/member/memberTheme';
import { createOptimisticId } from '@/lib/domain/workspaceState';

function createLoanRequestForm(today) {
  return {
    requested_amount: '',
    requested_term_months: '12',
    preferred_release_date: today,
    purpose: '',
  };
}

function formatRequestStatus(status) {
  if (status === 'pending_approval') {
    return 'Pending Approval';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getRequestStatusClass(status) {
  if (status === 'approved') {
    return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200';
  }

  if (status === 'rejected') {
    return 'bg-rose-500/10 border border-rose-500/30 text-rose-200';
  }

  return 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-200';
}

export default function MemberLoanRequestClient() {
  const {
    loans,
    loanRequests,
    pendingLoanRequests,
    summary,
    today,
    syncStatus,
    dispatch,
  } = useMemberWorkspace();
  const router = useRouter();
  const [form, setForm] = useState(() => createLoanRequestForm(today));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeLoan = loans.find((loan) => loan.repayment_status !== 'paid') || null;
  const pendingLoanRequest = pendingLoanRequests[0] || null;
  const isBlocked = Boolean(activeLoan || pendingLoanRequest);
  const isBusy = isSubmitting || syncStatus.state === 'saving';

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requestedAmount = Number.parseFloat(form.requested_amount);
    const requestedTermMonths = Number.parseInt(form.requested_term_months, 10);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || !Number.isInteger(requestedTermMonths) || requestedTermMonths <= 0) {
      setError('Please enter a valid requested amount and term.');
      return;
    }

    const optimisticId = createOptimisticId('loan-request');
    const now = new Date().toISOString();

    dispatch({
      type: 'loan_request_submit_started',
      payload: {
        request: {
          request_id: optimisticId,
          member_id: activeLoan?.member_id || loans[0]?.member_id || '',
          requested_amount: requestedAmount,
          requested_term_months: requestedTermMonths,
          preferred_release_date: form.preferred_release_date,
          purpose: form.purpose.trim(),
          status: 'pending_approval',
          reviewed_by: '',
          admin_notes: '',
          approved_interest_rate: '',
          approved_loan_id: '',
          created_at: now,
          updated_at: now,
        },
      },
    });

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/member/loan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_amount: requestedAmount,
          requested_term_months: requestedTermMonths,
          preferred_release_date: form.preferred_release_date,
          purpose: form.purpose.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        dispatch({
          type: 'loan_request_submit_failed',
          payload: {
            tempId: optimisticId,
            message: 'Your member session expired. Please sign in again.',
          },
        });
        router.push('/member-login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit loan request.');
      }

      dispatch({
        type: 'loan_request_submit_succeeded',
        payload: {
          tempId: optimisticId,
          request: data,
        },
      });
      setForm(createLoanRequestForm(today));
    } catch (requestError) {
      const message = requestError.message || 'Failed to submit loan request.';
      dispatch({
        type: 'loan_request_submit_failed',
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

  return (
    <main className={memberPageClassName}>
      <section className="grid gap-4 md:grid-cols-3">
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active Loan</p>
          <p className="text-3xl font-bold text-slate-100 mt-3">{activeLoan ? activeLoan.loan_id : 'None'}</p>
          <p className="text-sm text-slate-500 mt-2">New loan requests are blocked while a balance is still unpaid.</p>
        </div>
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending Requests</p>
          <p className="text-3xl font-bold text-cyan-200 mt-3">{summary.pending_loan_request_count}</p>
          <p className="text-sm text-slate-500 mt-2">Only admin-approved requests become actual loans.</p>
        </div>
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Request History</p>
          <p className="text-3xl font-bold text-[#d9e7cf] mt-3">{loanRequests.length}</p>
          <p className="text-sm text-slate-500 mt-2">Newest requests appear first.</p>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8">
        <div className={memberHeroPanelClassName}>
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Loan Request</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-50">Request a new loan for admin review.</h1>
            <p className="text-slate-400 leading-7">
              Requests stay pending until the admin reviews and approves them. A new loan cannot be issued while an older one still has an unpaid balance.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
              {error}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Requested Amount</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={form.requested_amount}
                  onChange={(event) => setForm({ ...form, requested_amount: event.target.value })}
                  disabled={isBusy || isBlocked}
                  placeholder="10000"
                  className={memberFieldClassName}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preferred Term</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.requested_term_months}
                  onChange={(event) => setForm({ ...form, requested_term_months: event.target.value })}
                  disabled={isBusy || isBlocked}
                  className={memberFieldClassName}
                />
              </label>
            </div>

            <label className="space-y-1.5 text-sm block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preferred Release Date</span>
              <input
                type="date"
                required
                value={form.preferred_release_date}
                onChange={(event) => setForm({ ...form, preferred_release_date: event.target.value })}
                disabled={isBusy || isBlocked}
                className={memberFieldClassName}
              />
            </label>

            <label className="space-y-1.5 text-sm block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Purpose / Notes</span>
              <textarea
                value={form.purpose}
                onChange={(event) => setForm({ ...form, purpose: event.target.value })}
                disabled={isBusy || isBlocked}
                rows={5}
                placeholder="Optional context for the admin review"
                className={`${memberFieldClassName} min-h-32 resize-y leading-6`}
              />
            </label>

            {activeLoan && (
              <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-100 text-sm">
                You still have an unpaid loan balance of {formatCurrency(activeLoan.balance)} on {activeLoan.loan_id}. Clear that balance before requesting another loan.
              </div>
            )}

            {!activeLoan && pendingLoanRequest && (
              <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-100 text-sm">
                Your latest request ({pendingLoanRequest.request_id}) is still waiting for admin approval.
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy || isBlocked}
              className={memberPrimaryButtonClassName}
            >
              {isBusy ? 'Submitting...' : 'Submit Loan Request'}
            </button>
          </form>
        </div>

        <div className="space-y-5">
          <div className={memberInfoCardClassName}>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Approval Flow</p>
            <p className="text-sm text-slate-300 leading-6">
              Requests stay in pending review until the admin manually approves the terms. Only after approval will the request become a real loan inside your ledger.
            </p>
          </div>

          <div className={memberTableCardClassName}>
            <div className="p-5 border-b border-slate-900/80 bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-100">Request History</h2>
            </div>
            <div className="divide-y divide-slate-900">
              {loanRequests.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No loan requests have been recorded yet.
                </div>
              ) : (
                loanRequests.map((request) => (
                  <article key={request.request_id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-slate-100">{request.request_id}</p>
                        <p className="text-xs text-slate-500">Submitted on {request.created_at?.split('T')[0] || 'Unknown'}</p>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRequestStatusClass(request.status)}`}>
                        {formatRequestStatus(request.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Requested Amount</p>
                        <p className="mt-2 font-semibold text-cyan-200">{formatCurrency(request.requested_amount)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Requested Term</p>
                        <p className="mt-2 font-semibold text-slate-100">{request.requested_term_months} months</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-slate-400">
                      <p>Preferred release: {request.preferred_release_date}</p>
                      {request.approved_loan_id && <p>Approved loan: {request.approved_loan_id}</p>}
                      {request.admin_notes && <p>Admin notes: {request.admin_notes}</p>}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}