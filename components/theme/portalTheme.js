export const portalPageClassName = 'relative flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8';

export const portalHeroPanelClassName = 'glass-surface p-6 sm:p-8 rounded-[32px] space-y-6 overflow-hidden relative';

export const portalMetricCardClassName = 'glass-surface p-6 rounded-3xl';

export const portalInfoCardClassName = 'glass-surface p-6 rounded-[32px] space-y-3';

export const portalTableCardClassName = 'glass-surface rounded-[28px] overflow-hidden';

export const portalFormCardClassName = 'glass-surface p-6 rounded-[32px] space-y-4';

export const portalSectionEyebrowClassName = 'text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400';

export const portalFieldClassName = 'w-full px-4 py-3 rounded-2xl border border-white/10 bg-slate-950/38 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-200/45 focus:bg-slate-950/54 backdrop-blur-xl';

export const portalPrimaryButtonClassName = 'w-full py-3.5 px-4 rounded-2xl bg-[#d9e7cf] hover:bg-[#e4efdc] text-slate-950 font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-[0_18px_40px_-26px_rgba(217,231,207,0.55)]';

export const portalSecondaryButtonClassName = 'rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-stone-100 hover:bg-white/12 transition-all';

export const portalGhostButtonClassName = 'rounded-2xl border border-white/10 bg-slate-950/28 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10 transition-all';

export const portalBadgeClassName = 'glass-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-100';

export const portalAuthShellClassName = 'relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6';

export const portalAuthCardClassName = 'glass-surface portal-window-focus w-full max-w-md rounded-[32px] p-8 shadow-[0_24px_60px_-32px_rgba(4,12,24,0.72)]';

export const portalTopLinkClassName = 'portal-fade-up portal-fade-up-delay-1 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-stone-100 transition-colors';

export function getPortalNavItemClassName(isActive) {
  return isActive
    ? 'px-3.5 py-2 rounded-xl border border-emerald-200/30 bg-white/12 text-stone-50 shadow-[0_10px_22px_-18px_rgba(255,255,255,0.45)] text-xs font-semibold transition-all'
    : 'px-3.5 py-2 rounded-xl border border-white/8 bg-slate-950/18 text-slate-300 hover:text-stone-50 hover:border-white/14 hover:bg-white/8 text-xs font-semibold transition-all';
}

export function getPortalSidebarTabClassName(isActive) {
  return isActive
    ? 'w-full flex items-center justify-between rounded-2xl border border-emerald-200/25 bg-white/10 px-4 py-3 text-left text-sm font-semibold text-stone-50 shadow-[0_18px_34px_-28px_rgba(217,231,207,0.45)] transition-all cursor-pointer'
    : 'w-full flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/18 px-4 py-3 text-left text-sm font-semibold text-slate-300 hover:text-stone-50 hover:border-white/14 hover:bg-white/8 transition-all cursor-pointer';
}

export function getPortalSyncMessageClassName(state) {
  if (state === 'saved') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  }

  if (state === 'error') {
    return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
  }

  return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100';
}