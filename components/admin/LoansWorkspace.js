import { useState } from 'react';
import {
  portalFieldClassName,
  portalFormCardClassName,
  portalPrimaryButtonClassName,
  portalTableCardClassName,
} from '@/components/theme/portalTheme';

function formatRepaymentStatus(status) {
  if (status === 'not_paid') {
    return 'Not Paid';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getRepaymentStatusClass(status) {
  if (status === 'paid') {
    return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
  }

  if (status === 'partial') {
    return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  }

  return 'bg-slate-500/10 border border-slate-500/30 text-slate-300';
}

export default function LoansWorkspace({
  today,
  members,
  loans,
  loanRequests,
  loanForm,
  setLoanForm,
  handleAddLoan,
  handleApproveLoanRequest,
  handleRejectLoanRequest,
  actionLoading,
}) {
  const memberLookup = new Map(members.map((member) => [member.member_id, member]));
  const [requestForms, setRequestForms] = useState({});
  const pendingLoanRequests = loanRequests.filter((request) => request.status === 'pending_approval');

  const getRequestForm = (loanRequest) => {
    return requestForms[loanRequest.request_id] || {
      approved_interest_rate: '0.03',
      release_date: loanRequest.preferred_release_date || today,
      admin_notes: '',
    };
  };

  const updateRequestForm = (requestId, nextValues) => {
    setRequestForms((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] || {}),
        ...nextValues,
      },
    }));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-200">Pending Loan Requests</h3>
          <span className="text-xs uppercase tracking-wider text-slate-500">Manual admin approval only</span>
        </div>
        <div className={portalTableCardClassName}>
          <div className="divide-y divide-slate-900">
            {pendingLoanRequests.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-500 text-sm">No loan requests are waiting for review.</div>
            ) : (
              pendingLoanRequests.map((loanRequest) => {
                const borrower = memberLookup.get(loanRequest.member_id);
                const requestForm = getRequestForm(loanRequest);

                return (
                  <article key={loanRequest.request_id} className="p-5 space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-mono text-sm font-semibold text-slate-100">{loanRequest.request_id}</p>
                        <p className="text-sm text-slate-200 mt-1">{borrower?.full_name || loanRequest.member_id}</p>
                        <p className="text-xs text-slate-500">{loanRequest.member_id} • Requested on {loanRequest.created_at?.split('T')[0] || 'Unknown'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm min-w-full lg:min-w-[320px] lg:max-w-[360px]">
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Requested Amount</p>
                          <p className="mt-2 font-semibold text-emerald-300">${Number.parseFloat(loanRequest.requested_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Requested Term</p>
                          <p className="mt-2 font-semibold text-slate-100">{loanRequest.requested_term_months} months</p>
                        </div>
                      </div>
                    </div>

                    {loanRequest.purpose && (
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/30 px-4 py-3 text-sm text-slate-300 leading-6">
                        {loanRequest.purpose}
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="space-y-1 text-sm">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approval Rate</span>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={requestForm.approved_interest_rate}
                          onChange={(event) => updateRequestForm(loanRequest.request_id, { approved_interest_rate: event.target.value })}
                          disabled={actionLoading}
                          className={portalFieldClassName}
                        />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Release Date</span>
                        <input
                          type="date"
                          value={requestForm.release_date}
                          onChange={(event) => updateRequestForm(loanRequest.request_id, { release_date: event.target.value })}
                          disabled={actionLoading}
                          className={portalFieldClassName}
                        />
                      </label>
                      <label className="space-y-1 text-sm md:col-span-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin Notes</span>
                        <textarea
                          value={requestForm.admin_notes}
                          onChange={(event) => updateRequestForm(loanRequest.request_id, { admin_notes: event.target.value })}
                          disabled={actionLoading}
                          rows={3}
                          className={`${portalFieldClassName} resize-y leading-6`}
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleApproveLoanRequest(loanRequest, requestForm)}
                        disabled={actionLoading}
                        className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        Approve Request
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectLoanRequest(loanRequest, requestForm.admin_notes)}
                        disabled={actionLoading}
                        className="py-2.5 px-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        Reject Request
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-slate-200">Loan Portfolio</h3>
          <div className={portalTableCardClassName}>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                  <tr>
                    <th className="px-5 py-3">Loan ID</th>
                    <th className="px-5 py-3">Borrower</th>
                    <th className="px-5 py-3">Principal</th>
                    <th className="px-5 py-3">Rate</th>
                    <th className="px-5 py-3">Term</th>
                    <th className="px-5 py-3">Total Payable</th>
                    <th className="px-5 py-3">Balance</th>
                    <th className="px-5 py-3 text-center">Repayment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-5 py-8 text-center text-slate-500 text-xs">
                        No loans registered yet.
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => {
                      const borrower = memberLookup.get(loan.member_id);

                      return (
                        <tr key={loan.loan_id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-semibold text-slate-200 text-xs">{loan.loan_id}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-300">
                            <p className="font-semibold">{borrower?.full_name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-500">{loan.member_id}</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs">${Number.parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-5 py-3.5 text-xs">{(Number.parseFloat(loan.interest_rate) * 100).toFixed(1)}%</td>
                          <td className="px-5 py-3.5 text-xs">{loan.term_months} mos</td>
                          <td className="px-5 py-3.5 font-medium text-xs">${Number.parseFloat(loan.total_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-5 py-3.5 font-medium text-emerald-400 text-xs">${Number.parseFloat(loan.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-5 py-3.5 text-center text-xs">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRepaymentStatusClass(loan.repayment_status)}`}>
                              {formatRepaymentStatus(loan.repayment_status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-900 md:hidden">
              {loans.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">No loans registered yet.</div>
              ) : (
                loans.map((loan) => {
                  const borrower = memberLookup.get(loan.member_id);

                  return (
                    <article key={loan.loan_id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-semibold text-slate-100">{loan.loan_id}</p>
                          <p className="text-sm text-slate-200">{borrower?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{loan.member_id}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRepaymentStatusClass(loan.repayment_status)}`}>
                          {formatRepaymentStatus(loan.repayment_status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Principal</p>
                          <p className="mt-2 font-semibold text-slate-100">${Number.parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Balance</p>
                          <p className="mt-2 font-semibold text-emerald-400">${Number.parseFloat(loan.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">Rate: {(Number.parseFloat(loan.interest_rate) * 100).toFixed(1)}% • Term: {loan.term_months} months</p>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-200">Issue New Loan</h3>
          <form onSubmit={handleAddLoan} className={portalFormCardClassName}>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Borrowing Member</label>
            <select
              required
              value={loanForm.member_id}
              onChange={(event) => setLoanForm({ ...loanForm, member_id: event.target.value })}
              className={portalFieldClassName}
            >
              <option value="">Select Member...</option>
              {members
                .filter((member) => member.status === 'active')
                .map((member) => (
                  <option key={member.member_id} value={member.member_id}>
                    {member.full_name} ({member.member_id})
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Principal Amount ($)</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={loanForm.principal_amount}
              onChange={(event) => setLoanForm({ ...loanForm, principal_amount: event.target.value })}
              placeholder="10000"
              disabled={actionLoading}
              className={portalFieldClassName}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Interest Rate (decimal)</label>
            <input
              type="number"
              required
              min="0"
              max="1"
              step="0.001"
              value={loanForm.interest_rate}
              onChange={(event) => setLoanForm({ ...loanForm, interest_rate: event.target.value })}
              placeholder="0.03 (for 3%)"
              disabled={actionLoading}
              className={portalFieldClassName}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Term (months)</label>
            <input
              type="number"
              required
              min="1"
              value={loanForm.term_months}
              onChange={(event) => setLoanForm({ ...loanForm, term_months: event.target.value })}
              placeholder="12"
              disabled={actionLoading}
              className={portalFieldClassName}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Release Date</label>
            <input
              type="date"
              required
              value={loanForm.release_date}
              onChange={(event) => setLoanForm({ ...loanForm, release_date: event.target.value })}
              disabled={actionLoading}
              className={portalFieldClassName}
            />
          </div>
            <button
              type="submit"
              disabled={actionLoading}
              className={portalPrimaryButtonClassName}
            >
              {actionLoading ? 'Issuing...' : 'Add Loan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}