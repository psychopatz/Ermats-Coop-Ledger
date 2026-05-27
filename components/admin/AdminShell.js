'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import PortalAmbientBackdrop from '@/components/theme/PortalAmbientBackdrop';
import {
  getPortalNavItemClassName,
  portalGhostButtonClassName,
} from '@/components/theme/portalTheme';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/payments', label: 'Payments' },
];

export default function AdminShell({ session, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPending = false;

  const handleLogout = async () => {
    try {
      await fetch('/api/session/logout', { method: 'POST' });
    } finally {
      router.push('/admin-login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden isolate">
      <PortalAmbientBackdrop fixed />
      <header className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,16,23,0.72),rgba(8,16,23,0.48))] backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6 min-w-0">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <Link href="/" className="text-xl sm:text-2xl font-black tracking-tight text-stone-50">
                Obong ES Coop Ledger
              </Link>
              <span className="glass-chip px-2.5 py-0.5 rounded-full text-[10px] text-stone-200 font-semibold uppercase tracking-[0.28em]">
                Admin Workspace
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

          <div className="flex items-center justify-between gap-3 xl:self-auto min-w-0">
            <div className="text-left sm:text-right min-w-0 rounded-2xl border border-white/8 bg-white/6 px-4 py-2.5 backdrop-blur-md">
              <p className="text-sm font-medium text-slate-200">{session.email}</p>
              <p className="text-xs text-slate-500">Testing mode only</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className={`${portalGhostButtonClassName} py-2 px-4 text-xs disabled:opacity-50`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1">{children}</div>
    </div>
  );
}