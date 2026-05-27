'use client';

import { useEffect, useState } from 'react';
import { useMemberWorkspace } from '@/components/member/MemberWorkspaceProvider';
import {
  formatCurrency,
  formatRecordStatus,
  formatRepaymentStatus,
  getRecordStatusClass,
  getRepaymentStatusClass,
} from '@/components/member/memberUi';
import {
  memberMetricCardClassName,
  memberPageClassName,
  memberTableCardClassName,
} from '@/components/member/memberTheme';

function clampPercentage(value) {
  return Math.max(0, Math.min(100, value));
}

function getCircumference(radius) {
  return 2 * Math.PI * radius;
}

function getDefaultBulletinMessage() {
  return 'Hello there. Your latest verified payments, loan balances, and admin updates will appear here. If you have a pending payment or loan request, the admin will review it before it changes your official ledger.';
}

function LoanProgressDial({ loan, pendingAmount }) {
  const [isAnimated, setIsAnimated] = useState(false);
  const total = Number.parseFloat(loan.total_payable) || 0;
  const remaining = Number.parseFloat(loan.balance) || 0;
  const paid = Math.max(total - remaining, 0);
  const normalizedPending = Math.min(pendingAmount, remaining);
  const paidPercent = total > 0 ? clampPercentage((paid / total) * 100) : 0;
  const pendingPercent = total > 0 ? clampPercentage((normalizedPending / total) * 100) : 0;
  const remainingVerified = Math.max(remaining - normalizedPending, 0);
  const remainingPercent = total > 0 ? clampPercentage((remainingVerified / total) * 100) : 0;
  const displayPaidPercent = isAnimated ? paidPercent : 0;
  const displayPendingPercent = isAnimated ? pendingPercent : 0;
  const displayRemainingPercent = isAnimated ? remainingPercent : 0;
  const outerRadius = 72;
  const middleRadius = 54;
  const innerRadius = 37;
  const outerCircumference = getCircumference(outerRadius);
  const middleCircumference = getCircumference(middleRadius);
  const innerCircumference = getCircumference(innerRadius);
  const gradientId = `loan-progress-${loan.loan_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [loan.loan_id]);

  const legendItems = [
    {
      label: 'Verified Paid',
      value: paid,
      percent: paidPercent,
      tint: 'border-emerald-200/18 bg-emerald-300/8 text-emerald-100',
    },
    {
      label: 'Pending Review',
      value: normalizedPending,
      percent: pendingPercent,
      tint: 'border-amber-200/18 bg-amber-300/8 text-amber-100',
    },
    {
      label: 'Remaining Balance',
      value: remaining,
      percent: remainingPercent,
      tint: 'border-slate-200/16 bg-slate-300/8 text-stone-100',
    },
  ];

  return (
    <div className="glass-surface p-6 sm:p-8 rounded-[32px] space-y-6 overflow-hidden relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(167,243,208,0.12),_transparent_62%)]" />

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Loan Progress</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-stone-50">{loan.loan_id}</p>
            <p className="text-sm text-slate-300/75 mt-1">Verified payments are posted separately from items still waiting for admin review.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Outstanding</p>
            <p className="mt-1 text-2xl font-bold text-stone-50">${formatCurrency(remaining)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative mx-auto w-[208px] h-[208px] [transform:perspective(960px)_rotateX(14deg)]">
          <div className="progress-pedestal absolute inset-x-7 bottom-2 h-8 rounded-full bg-emerald-950/25 blur-2xl" />
          <div className="progress-face absolute inset-0 rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_28%,_rgba(255,255,255,0.12),_transparent_26%),linear-gradient(180deg,_rgba(12,24,31,0.94),_rgba(5,10,18,0.92))]" />

          <svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full -rotate-90 drop-shadow-[0_12px_24px_rgba(8,20,24,0.3)]">
            <defs>
              <linearGradient id={`${gradientId}-paid`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bbf7d0" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id={`${gradientId}-pending`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id={`${gradientId}-remaining`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>

            <circle cx="110" cy="110" r={outerRadius} stroke="rgba(15, 23, 42, 0.72)" strokeWidth="24" fill="none" />
            <circle
              cx="110"
              cy="110"
              r={outerRadius}
              stroke={`url(#${gradientId}-remaining)`}
              strokeWidth="24"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={outerCircumference}
              strokeDashoffset={outerCircumference - ((displayRemainingPercent / 100) * outerCircumference)}
              style={{ transition: 'stroke-dashoffset 1.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />

            <circle cx="110" cy="110" r={middleRadius} stroke="rgba(51, 65, 85, 0.52)" strokeWidth="16" fill="none" />
            <circle
              cx="110"
              cy="110"
              r={middleRadius}
              stroke={`url(#${gradientId}-pending)`}
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={middleCircumference}
              strokeDashoffset={middleCircumference - ((displayPendingPercent / 100) * middleCircumference)}
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />

            <circle cx="110" cy="110" r={innerRadius} stroke="rgba(34, 197, 94, 0.12)" strokeWidth="12" fill="none" />
            <circle
              cx="110"
              cy="110"
              r={innerRadius}
              stroke={`url(#${gradientId}-paid)`}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={innerCircumference}
              strokeDashoffset={innerCircumference - ((displayPaidPercent / 100) * innerCircumference)}
              style={{ transition: 'stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </svg>

          <div className="absolute inset-[42px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_42%),linear-gradient(180deg,_rgba(12,20,30,0.96),_rgba(5,10,18,0.92))] flex flex-col items-center justify-center text-center px-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Paid</p>
            <p className="text-4xl font-black text-stone-50 mt-1">{paidPercent.toFixed(0)}%</p>
            <p className="text-xs text-slate-400 mt-1">of total payable</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {legendItems.map((item) => (
            <div key={item.label} className={`rounded-[24px] border px-4 py-4 ${item.tint} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-current/80">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-current">${formatCurrency(item.value)}</p>
                </div>
                <p className="text-sm font-semibold text-current/85">{item.percent.toFixed(0)}% share</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MemberOverviewClient() {
  const { activeBulletin, loans, pendingPayments, pendingLoanRequests, summary } = useMemberWorkspace();
  const activeLoan = loans.find((loan) => loan.repayment_status !== 'paid') || null;
  const activeLoanPendingAmount = activeLoan
    ? pendingPayments
      .filter((payment) => payment.loan_id === activeLoan.loan_id)
      .reduce((sum, payment) => sum + Number.parseFloat(payment.amount_received || 0), 0)
    : 0;
  const bulletinMessage = activeBulletin?.message?.trim() || getDefaultBulletinMessage();

  return (
    <main className={memberPageClassName}>
      <section className="grid xl:grid-cols-[1.18fr_1fr] gap-6 items-start">
        <div className="glass-surface p-6 sm:p-8 rounded-[32px] space-y-6 overflow-hidden relative">
          <div className="pointer-events-none absolute -top-10 right-0 h-32 w-32 rounded-full bg-emerald-200/8 blur-3xl" />
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Admin Bulletin</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-50">Overview</h1>
            <p className="max-w-2xl text-slate-300/80 text-base md:text-lg leading-7 whitespace-pre-wrap">{bulletinMessage}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Open Balance</p>
              <p className="mt-2 text-3xl font-bold text-stone-50">${formatCurrency(summary.total_balance)}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Awaiting Review</p>
              <p className="mt-2 text-3xl font-bold text-stone-50">{pendingPayments.length}</p>
            </div>
          </div>
        </div>

        {activeLoan ? (
          <LoanProgressDial loan={activeLoan} pendingAmount={activeLoanPendingAmount} />
        ) : (
          <div className="glass-surface p-6 sm:p-8 rounded-[32px] space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan Status</p>
            <p className="text-2xl font-bold text-slate-100">No active loan in progress</p>
            <p className="text-sm text-slate-400 leading-6">
              {pendingLoanRequests.length
                ? 'You already have a pending loan request waiting for admin review.'
                : 'You can use the Loan Request tab to ask for a new loan when you are ready.'}
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Outstanding Balance</p>
          <p className="text-3xl font-bold text-emerald-300 mt-3">${formatCurrency(summary.total_balance)}</p>
          <p className="text-sm text-slate-500 mt-2">Approved balance still due</p>
        </div>
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Payable</p>
          <p className="text-3xl font-bold text-indigo-200 mt-3">${formatCurrency(summary.total_payable)}</p>
          <p className="text-sm text-slate-500 mt-2">Across all configured loans</p>
        </div>
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Approved Payments</p>
          <p className="text-3xl font-bold text-sky-200 mt-3">{summary.approved_count}</p>
          <p className="text-sm text-slate-500 mt-2">Verified by admin</p>
        </div>
        <div className={memberMetricCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Loan Accounts</p>
          <p className="text-3xl font-bold text-slate-100 mt-3">{summary.total_loans}</p>
          <p className="text-sm text-slate-500 mt-2">Tracked inside this portal</p>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1.3fr_1fr] gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-100">Loan Accounts</h2>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Live summary</span>
          </div>
          <div className={memberTableCardClassName}>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                  <tr>
                    <th className="px-6 py-4">Loan ID</th>
                    <th className="px-6 py-4">Principal</th>
                    <th className="px-6 py-4">Term</th>
                    <th className="px-6 py-4">Outstanding</th>
                    <th className="px-6 py-4">Release Date</th>
                    <th className="px-6 py-4 text-center">Repayment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-sm">
                        No loan accounts are linked to this member.
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => (
                      <tr key={loan.loan_id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-slate-100">{loan.loan_id}</td>
                        <td className="px-6 py-4">${formatCurrency(loan.principal_amount)}</td>
                        <td className="px-6 py-4">{loan.term_months} mos</td>
                        <td className="px-6 py-4 text-emerald-300 font-medium">${formatCurrency(loan.balance)}</td>
                        <td className="px-6 py-4 text-slate-400">{loan.release_date}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRepaymentStatusClass(loan.repayment_status)}`}>
                            {formatRepaymentStatus(loan.repayment_status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-900 md:hidden">
              {loans.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-500 text-sm">
                  No loan accounts are linked to this member.
                </div>
              ) : (
                loans.map((loan) => (
                  <article key={loan.loan_id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-slate-100">{loan.loan_id}</p>
                        <p className="text-xs text-slate-500">Released on {loan.release_date}</p>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRepaymentStatusClass(loan.repayment_status)}`}>
                        {formatRepaymentStatus(loan.repayment_status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Principal</p>
                        <p className="mt-2 font-semibold text-slate-100">${formatCurrency(loan.principal_amount)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Outstanding</p>
                        <p className="mt-2 font-semibold text-emerald-300">${formatCurrency(loan.balance)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">Term: {loan.term_months} months</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-100">Pending Approval</h2>
            <span className="text-xs uppercase tracking-[0.24em] text-cyan-300">Payment must be reviewed by admin manually</span>
          </div>
          <div className={memberTableCardClassName}>
            <div className="p-5 border-b border-slate-900/80 bg-slate-900/50">
              <p className="text-sm text-slate-400">These submissions are recorded but not deducted from your balance until an admin approves them.</p>
            </div>
            <div className="divide-y divide-slate-900">
              {pendingPayments.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No payments are waiting for review right now.
                </div>
              ) : (
                pendingPayments.map((payment) => (
                  <div key={payment.payment_id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{payment.loan_id}</p>
                        <p className="text-xs text-slate-500">Submitted on {payment.payment_date}</p>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRecordStatusClass(payment.record_status)}`}>
                        {formatRecordStatus(payment.record_status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-xs uppercase tracking-wider text-slate-500">Amount</p>
                        <p className="text-lg font-bold text-cyan-200 mt-1">${formatCurrency(payment.amount_received)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-3">
                        <p className="text-xs uppercase tracking-wider text-slate-500">Method</p>
                        <p className="text-lg font-bold text-slate-100 mt-1 uppercase">{payment.payment_method}</p>
                      </div>
                    </div>
                    {payment.reference_code && (
                      <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100">
                        Reference code: <span className="font-mono">{payment.reference_code}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}