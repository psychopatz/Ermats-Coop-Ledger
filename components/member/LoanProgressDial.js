'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/components/member/memberUi';

function clampPercentage(value) {
  return Math.max(0, Math.min(100, value));
}

function getCircumference(radius) {
  return 2 * Math.PI * radius;
}

function createRingSegments(items, gap = 2.8, startOffset = 6) {
  const visibleItems = items.filter((item) => item.percent > 0.01);
  if (visibleItems.length === 0) {
    return [];
  }

  const totalPercent = visibleItems.reduce((sum, item) => sum + item.percent, 0);
  const totalGap = gap * visibleItems.length;
  const usableLength = Math.max(100 - totalGap, 0);
  let cursor = startOffset;

  return visibleItems.map((item) => {
    const length = totalPercent > 0 ? (item.percent / totalPercent) * usableLength : 0;
    const segment = {
      ...item,
      length,
      offset: cursor,
    };

    cursor += length + gap;
    return segment;
  });
}

export default function LoanProgressDial({ loan, pendingAmount }) {
  const [isAnimated, setIsAnimated] = useState(false);
  const emptyTrackStroke = 'rgba(19, 30, 42, 0.92)';
  const total = Number.parseFloat(loan.total_payable) || 0;
  const remaining = Number.parseFloat(loan.balance) || 0;
  const paid = Math.max(total - remaining, 0);
  const normalizedPending = Math.min(pendingAmount, remaining);
  const remainingVerified = Math.max(remaining - normalizedPending, 0);
  const paidPercent = total > 0 ? clampPercentage((paid / total) * 100) : 0;
  const pendingPercent = total > 0 ? clampPercentage((normalizedPending / total) * 100) : 0;
  const remainingPercent = total > 0 ? clampPercentage((remainingVerified / total) * 100) : 0;

  const outerRadius = 82;
  const middleRadius = 57;
  const innerRadius = 45;
  const middleCircumference = getCircumference(middleRadius);
  const innerCircumference = getCircumference(innerRadius);
  const safeLoanId = loan.loan_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const gradientPrefix = `loan-balance-${safeLoanId}`;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [loan.loan_id]);

  const outerSegments = createRingSegments([
    { key: 'paid', percent: paidPercent, stroke: `url(#${gradientPrefix}-paid)` },
    { key: 'pending', percent: pendingPercent, stroke: `url(#${gradientPrefix}-pending)` },
    { key: 'remaining', percent: remainingPercent, stroke: `url(#${gradientPrefix}-remaining)` },
  ]);

  const legendItems = [
    {
      label: 'Verified Paid',
      value: paid,
      percent: paidPercent,
      tint: 'border-emerald-200/18 bg-emerald-300/8 text-emerald-100',
      note: 'Posted to ledger',
    },
    {
      label: 'Pending Review',
      value: normalizedPending,
      percent: pendingPercent,
      tint: 'border-amber-200/18 bg-amber-300/8 text-amber-100',
      note: 'Awaiting admin check',
    },
    {
      label: 'Remaining Balance',
      value: remainingVerified,
      percent: remainingPercent,
      tint: 'border-slate-800/90 bg-slate-950/72 text-slate-100',
      note: 'Still unpaid',
    },
  ];

  return (
    <div className="glass-surface p-6 sm:p-8 rounded-[32px] space-y-6 overflow-hidden relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(167,243,208,0.12),_transparent_62%)]" />

      <div className="space-y-2 relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Loan Progress</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-stone-50">{loan.loan_id}</p>
            <p className="text-sm text-slate-300/75 mt-1">The chart separates paid, pending, and unpaid balance so the remaining amount only appears once.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Total Payable</p>
            <p className="mt-1 text-2xl font-bold text-stone-50">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="portal-fade-up portal-fade-up-delay-1 relative mx-auto aspect-square w-[min(100%,340px)] [transform:perspective(1200px)_rotateX(8deg)]">
          <div className="progress-pedestal absolute inset-x-10 bottom-7 h-11 rounded-full bg-emerald-950/20 blur-2xl" />
          <div className="progress-face absolute inset-[8px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_28%_24%,_rgba(255,255,255,0.16),_transparent_26%),linear-gradient(180deg,_rgba(12,24,31,0.96),_rgba(5,10,18,0.94))]" />
          <div className="absolute inset-[22px] rounded-full border border-white/6 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_58%),linear-gradient(180deg,_rgba(9,16,26,0.88),_rgba(4,8,16,0.96))] shadow-[inset_0_16px_26px_rgba(148,163,184,0.05),inset_0_-22px_30px_rgba(2,6,23,0.88)]" />

          <svg viewBox="0 0 294 294" className="absolute inset-0 h-full w-full rotate-[-126deg] drop-shadow-[0_16px_30px_rgba(8,20,24,0.34)]">
            <defs>
              <linearGradient id={`${gradientPrefix}-paid`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d9ffe8" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
              <linearGradient id={`${gradientPrefix}-pending`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id={`${gradientPrefix}-remaining`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#121c27" />
                <stop offset="100%" stopColor="#0a121b" />
              </linearGradient>
            </defs>

            <circle cx="147" cy="147" r={outerRadius} stroke={emptyTrackStroke} strokeWidth="34" fill="none" />
            {outerSegments.map((segment, index) => (
              <circle
                key={segment.key}
                cx="147"
                cy="147"
                r={outerRadius}
                pathLength="100"
                stroke={segment.stroke}
                strokeWidth="34"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${isAnimated ? segment.length : 0} 100`}
                strokeDashoffset={-segment.offset}
                style={{ transition: `stroke-dasharray ${0.95 + (index * 0.16)}s cubic-bezier(0.22, 1, 0.36, 1)` }}
              />
            ))}

            <circle cx="147" cy="147" r={middleRadius} stroke="rgba(20, 32, 45, 0.86)" strokeWidth="10" fill="none" />
            <circle
              cx="147"
              cy="147"
              r={middleRadius}
              stroke={`url(#${gradientPrefix}-paid)`}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${(middleCircumference * (isAnimated ? paidPercent : 0)) / 100} ${middleCircumference}`}
              strokeDashoffset={middleCircumference * 0.17}
              style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />

            <circle cx="147" cy="147" r={innerRadius} stroke="rgba(18, 29, 40, 0.9)" strokeWidth="8" fill="none" />
            <circle
              cx="147"
              cy="147"
              r={innerRadius}
              stroke={`url(#${gradientPrefix}-pending)`}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${(innerCircumference * (isAnimated ? pendingPercent : 0)) / 100} ${innerCircumference}`}
              strokeDashoffset={-innerCircumference * 0.12}
              style={{ transition: 'stroke-dasharray 1.28s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </svg>

          <div className="absolute inset-[29%] rounded-full border border-slate-700/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_44%),linear-gradient(180deg,_rgba(13,22,32,0.99),_rgba(5,10,18,0.98))] flex flex-col items-center justify-center text-center px-[11%] shadow-[inset_0_14px_22px_rgba(148,163,184,0.04),inset_0_-18px_28px_rgba(2,6,23,0.92)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200 sm:text-[11px]">Verified Paid</p>
            <p className="mt-2 text-[clamp(2.4rem,10vw,3.5rem)] font-black leading-none text-white drop-shadow-[0_8px_18px_rgba(2,6,23,0.45)]">{paidPercent.toFixed(0)}%</p>
            <div className="mt-3 space-y-1">
              <p className="text-[clamp(0.95rem,3.6vw,1.2rem)] font-bold leading-none text-slate-100">{formatCurrency(paid)}</p>
              <p className="text-[11px] font-medium leading-4 text-slate-300">of {formatCurrency(total)} total</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 portal-fade-up portal-fade-up-delay-2">
          {legendItems.map((item) => (
            <div key={item.label} className={`rounded-[24px] border px-4 py-4 ${item.tint} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-current/80">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-current">{formatCurrency(item.value)}</p>
                </div>
                <p className="text-sm font-semibold text-current/85">{item.percent.toFixed(0)}% share</p>
                <p className="text-[11px] text-current/65">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}