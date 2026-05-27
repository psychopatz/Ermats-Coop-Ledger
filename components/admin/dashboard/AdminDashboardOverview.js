import Link from 'next/link';
import {
  portalInfoCardClassName,
  portalMetricCardClassName,
} from '@/components/theme/portalTheme';

export default function AdminDashboardOverview({ membersCount, loansCount, paymentsCount }) {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <div className={portalMetricCardClassName}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Members</p>
        <p className="text-3xl font-bold text-slate-100 mt-2">{membersCount}</p>
        <p className="text-xs text-slate-500 mt-2">Sanitized records available to the admin workspace</p>
      </div>
      <div className={portalMetricCardClassName}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Loans</p>
        <p className="text-3xl font-bold text-[#d9e7cf] mt-2">{loansCount}</p>
        <p className="text-xs text-slate-500 mt-2">Repayment status is derived from current balances</p>
      </div>
      <div className={portalMetricCardClassName}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payments</p>
        <p className="text-3xl font-bold text-emerald-400 mt-2">{paymentsCount}</p>
        <p className="text-xs text-slate-500 mt-2">Grouped analytics and payment methods live in the payments hub</p>
      </div>
      <Link href="/admin/payments" className={`${portalInfoCardClassName} transition-colors hover:bg-white/10`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Payments Hub</p>
        <p className="text-2xl font-bold text-slate-100 mt-2">Year / Month / Week</p>
        <p className="text-xs text-slate-400 mt-2">Review grouped collections, payment methods, and repayment visibility on a dedicated page.</p>
      </Link>
    </section>
  );
}