'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceProvider';
import { groupPaymentsByPeriod, parseAmount } from '@/lib/domain/payments';

function formatRecordStatus(status) {
  if (status === 'pending_approval') {
    return 'Pending Approval';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatRepaymentStatus(status) {
  if (status === 'not_paid') {
    return 'Not Paid';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getRepaymentStatusClass(status) {
  if (status === 'paid') {
    return 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400';
  }

  if (status === 'partial') {
    return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  }

  return 'bg-slate-500/10 border border-slate-500/30 text-slate-300';
}

function getRecordStatusClass(status) {
  if (status === 'pending_approval') {
    return 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-200';
  }

  return status === 'voided'
    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
}

function createPaymentForm(today) {
  return {
    loan_id: '',
    amount_received: '',
    payment_date: today,
    payment_method: 'cash',
  };
}

export default function AdminPaymentsClient() {
  const { members, loans, payments, today } = useAdminWorkspace();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [groupBy, setGroupBy] = useState('month');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [recordStatusFilter, setRecordStatusFilter] = useState('all');
  const [repaymentStatusFilter, setRepaymentStatusFilter] = useState('all');
  const [paymentForm, setPaymentForm] = useState(createPaymentForm(today));
  const [voidPaymentId, setVoidPaymentId] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const memberLookup = new Map(members.map((member) => [member.member_id, member]));
  const loanLookup = new Map(loans.map((loan) => [loan.loan_id, loan]));
  const isBusy = isSubmitting || isPending;

  const visiblePayments = payments.filter((payment) => {
    if (paymentMethodFilter !== 'all' && payment.payment_method !== paymentMethodFilter) {
      return false;
    }

    if (recordStatusFilter !== 'all' && payment.record_status !== recordStatusFilter) {
      return false;
    }

    if (repaymentStatusFilter !== 'all' && payment.repayment_status !== repaymentStatusFilter) {
      return false;
    }

    return true;
  });

  const groupedPayments = groupPaymentsByPeriod(visiblePayments, groupBy);
  const collectedAmount = visiblePayments
    .filter((payment) => payment.record_status === 'approved')
    .reduce((sum, payment) => sum + parseAmount(payment.amount_received), 0);
  const pendingAmount = visiblePayments
    .filter((payment) => payment.record_status === 'pending_approval')
    .reduce((sum, payment) => sum + parseAmount(payment.amount_received), 0);
  const pendingCount = visiblePayments.filter((payment) => payment.record_status === 'pending_approval').length;
  const voidedCount = visiblePayments.filter((payment) => payment.record_status === 'voided').length;

  const refreshWorkspace = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const submitRequest = async (url, options, fallbackMessage) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push('/admin-login');
        refreshWorkspace();
        return null;
      }

      if (!response.ok) {
        throw new Error(data.error || fallbackMessage);
      }

      refreshWorkspace();
      return data;
    } catch (requestError) {
      setError(requestError.message || fallbackMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (event) => {
    event.preventDefault();

    const selectedLoan = loanLookup.get(paymentForm.loan_id);
    if (!selectedLoan) {
      setError('Please select a valid loan for this payment.');
      return;
    }

    const result = await submitRequest(
      '/api/payments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: paymentForm.loan_id,
          member_id: selectedLoan.member_id,
          amount_received: Number.parseFloat(paymentForm.amount_received),
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
        }),
      },
      'Failed to record payment.'
    );

    if (result) {
      setPaymentForm(createPaymentForm(today));
    }
  };

  const handleVoidPayment = async (event) => {
    event.preventDefault();

    if (!voidPaymentId) {
      return;
    }

    const result = await submitRequest(
      `/api/payments/${voidPaymentId}/void`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ void_reason: voidReason }),
      },
      'Failed to void payment.'
    );

    if (result) {
      setVoidPaymentId(null);
      setVoidReason('');
    }
  };

  const handleApprovePayment = async (paymentId) => {
    await submitRequest(
      `/api/payments/${paymentId}/approve`,
      {
        method: 'PATCH',
      },
      'Failed to approve payment.'
    );
  };

  return (
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visible Payments</p>
          <p className="text-3xl font-bold text-slate-100 mt-2">{visiblePayments.length}</p>
          <p className="text-xs text-slate-500 mt-2">Filtered by your current controls</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved Amount</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">${collectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-500 mt-2">Already reflected in official balances</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Approval</p>
          <p className="text-3xl font-bold text-cyan-200 mt-2">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-2">${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} waiting for review</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40">
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

      <section className="grid xl:grid-cols-[1.6fr_1fr] gap-8">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Payments Analytics</h2>
                <p className="text-sm text-slate-400">Group collections by year, month, or ISO week while keeping repayment and record status visible.</p>
              </div>
              <button
                onClick={refreshWorkspace}
                disabled={isBusy}
                className="py-2 px-4 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                Refresh Workspace
              </button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Group By</span>
                <select
                  value={groupBy}
                  onChange={(event) => setGroupBy(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="year">Year</option>
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Method</span>
                <select
                  value={paymentMethodFilter}
                  onChange={(event) => setPaymentMethodFilter(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
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
                  onChange={(event) => setRepaymentStatusFilter(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
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
                  onChange={(event) => setRecordStatusFilter(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Records</option>
                  <option value="approved">Approved</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="voided">Voided</option>
                </select>
              </label>
            </div>
          </div>

          <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Grouped Totals</h3>
              <span className="text-xs uppercase tracking-wider text-slate-500">{groupBy} buckets</span>
            </div>
            <div className="overflow-x-auto">
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
                        <td className="px-5 py-3.5 font-medium text-emerald-400">${group.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
          </div>

          <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/40">
              <h3 className="text-lg font-bold text-slate-100">Payment Ledger</h3>
            </div>
            <div className="overflow-x-auto">
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
                  {visiblePayments.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-5 py-8 text-center text-slate-500 text-sm">
                        No payments match the current filters.
                      </td>
                    </tr>
                  ) : (
                    visiblePayments.map((payment) => {
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
                          <td className="px-5 py-3.5 font-medium text-xs">${parseAmount(payment.amount_received).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
                                  onClick={() => handleApprovePayment(payment.payment_id)}
                                  disabled={isBusy}
                                  className="text-xs text-cyan-300 hover:text-cyan-200 font-semibold disabled:opacity-50 cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                              {payment.record_status !== 'voided' && (
                                <button
                                  onClick={() => {
                                    setVoidPaymentId(payment.payment_id);
                                    setError('');
                                  }}
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
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleRecordPayment} className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-100">Record Payment</h3>
              <p className="text-sm text-slate-400 mt-1">Store the payment method and keep the repayment status derived from the linked loan balance.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Loan</label>
              <select
                required
                value={paymentForm.loan_id}
                onChange={(event) => setPaymentForm({ ...paymentForm, loan_id: event.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Loan...</option>
                {loans
                  .filter((loan) => loan.repayment_status !== 'paid')
                  .map((loan) => (
                    <option key={loan.loan_id} value={loan.loan_id}>
                      {loan.loan_id} - {(memberLookup.get(loan.member_id)?.full_name || loan.member_id)} (${parseAmount(loan.balance).toLocaleString()} bal)
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amount Received ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={paymentForm.amount_received}
                  onChange={(event) => setPaymentForm({ ...paymentForm, amount_received: event.target.value })}
                  placeholder="1000"
                  disabled={isBusy}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentForm.payment_date}
                  onChange={(event) => setPaymentForm({ ...paymentForm, payment_date: event.target.value })}
                  disabled={isBusy}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Method</label>
              <select
                value={paymentForm.payment_method}
                onChange={(event) => setPaymentForm({ ...paymentForm, payment_method: event.target.value })}
                disabled={isBusy}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all disabled:opacity-50 text-sm cursor-pointer"
            >
              {isBusy ? 'Processing...' : 'Record Payment'}
            </button>
          </form>

          {voidPaymentId && (
            <form onSubmit={handleVoidPayment} className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-rose-400">Void Payment</h3>
                  <p className="text-xs text-slate-500 mt-1">Selected payment: {voidPaymentId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVoidPaymentId(null);
                    setVoidReason('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Void Reason</label>
                <input
                  type="text"
                  required
                  value={voidReason}
                  onChange={(event) => setVoidReason(event.target.value)}
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
          )}
        </div>
      </section>
    </main>
  );
}