'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6 min-w-0">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <Link href="/" className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                Coop Ledger
              </Link>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
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
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-100 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center justify-between gap-3 xl:self-auto min-w-0">
            <div className="text-left sm:text-right min-w-0">
              <p className="text-sm font-medium text-slate-200">{session.email}</p>
              <p className="text-xs text-slate-500">Testing mode only</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}