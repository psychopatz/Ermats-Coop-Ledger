'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/member-dashboard', label: 'Overview' },
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
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,1))]" />
      <header className="relative border-b border-slate-900/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6 min-w-0">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <Link href="/" className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-200">
                Coop Ledger
              </Link>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">
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
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-100 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center justify-between gap-4 xl:self-auto min-w-0">
            <div className="text-left sm:text-right min-w-0">
              <p className="text-sm font-medium text-slate-100">{session.full_name}</p>
              <p className="text-xs text-slate-500">{session.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="py-1.5 px-3.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all text-xs font-semibold disabled:opacity-50 cursor-pointer"
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