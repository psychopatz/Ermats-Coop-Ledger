'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import PortalAmbientBackdrop from '@/components/theme/PortalAmbientBackdrop';
import { getPortalNavItemClassName, portalGhostButtonClassName } from '@/components/theme/portalTheme';

const NAV_ITEMS = [
  { href: '/member-dashboard', label: 'Overview' },
  { href: '/member-dashboard/loan-request', label: 'Loan Request' },
  { href: '/member-dashboard/payment', label: 'Payment' },
  { href: '/member-dashboard/payment-history', label: 'Payment History' },
];

export default function MemberShell({ session, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPending = false;

  const handleLogout = async () => {
    try {
      await fetch('/api/session/logout', { method: 'POST' });
    } finally {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#08111a] text-slate-100 flex flex-col relative overflow-hidden isolate">
      <PortalAmbientBackdrop fixed />
      <header className="relative sticky top-0 z-20 border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,16,23,0.72),rgba(8,16,23,0.48))] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6 min-w-0">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <Link href="/" className="text-xl sm:text-2xl font-black tracking-tight text-stone-50">
                Obong ES Cooperative Banking
              </Link>
              <span className="glass-chip px-2.5 py-0.5 rounded-full text-[10px] text-stone-200 font-semibold uppercase tracking-[0.28em]">
                Member Portal
              </span>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={getPortalNavItemClassName(isActive)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center justify-between gap-4 xl:self-auto min-w-0">
            <div className="text-left sm:text-right min-w-0 rounded-2xl border border-white/8 bg-white/6 px-4 py-2.5 backdrop-blur-md">
              <p className="text-sm font-semibold text-stone-50">{session.full_name}</p>
              <p className="text-xs text-slate-300/75">{session.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className={`${portalGhostButtonClassName} py-2 px-4 text-xs disabled:opacity-50 backdrop-blur-xl`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 transition-[opacity,transform] duration-300">{children}</div>
    </div>
  );
}