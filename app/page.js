// app/page.js
import Link from 'next/link';
import PortalAmbientBackdrop from '@/components/theme/PortalAmbientBackdrop';
import {
  portalAuthShellClassName,
  portalBadgeClassName,
  portalHeroPanelClassName,
  portalInfoCardClassName,
  portalSectionEyebrowClassName,
} from '@/components/theme/portalTheme';

export default function Home() {
  return (
    <main className={portalAuthShellClassName}>
      <PortalAmbientBackdrop />

      <div className="relative z-10 w-full max-w-5xl space-y-8 text-center">
        <div className={`${portalBadgeClassName} border-amber-300/20 text-amber-200`}>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
          Testing Mode
        </div>

        <section className={`${portalHeroPanelClassName} max-w-4xl mx-auto`}>
          <div className="pointer-events-none absolute -top-12 right-6 h-40 w-40 rounded-full bg-emerald-200/10 blur-3xl" />
          <div className="space-y-4 relative">
            <p className={portalSectionEyebrowClassName}>Obong ES Cooperative Banking</p>
            <h1 className="text-5xl font-black tracking-tight text-stone-50 md:text-7xl">
              Obong ES Coop Ledger
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-300/82 md:text-xl">
              A cooperative loan ledger system with one visual language across member, admin, and public access points, backed entirely by Google Sheets.
            </p>
          </div>
        </section>

        <div className="grid max-w-3xl gap-6 mx-auto pt-2 md:grid-cols-2">
          <Link
            href="/member-login"
            className={`${portalInfoCardClassName} group block text-left transition-all hover:border-emerald-200/24 hover:bg-white/10`}
          >
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-200/6 blur-2xl transition-colors group-hover:bg-emerald-200/12 pointer-events-none"></div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/18 bg-emerald-200/10 text-[#d9e7cf] transition-transform group-hover:scale-105">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 transition-colors group-hover:text-[#e4efdc]">
              Member Portal
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Log in with your credentials to view your active loans, track payment history, and check your balances.
            </p>
          </Link>

          <Link
            href="/admin-login"
            className={`${portalInfoCardClassName} group block text-left transition-all hover:border-emerald-200/24 hover:bg-white/10`}
          >
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-200/6 blur-2xl transition-colors group-hover:bg-emerald-200/12 pointer-events-none"></div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/18 bg-emerald-200/10 text-[#d9e7cf] transition-transform group-hover:scale-105">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 transition-colors group-hover:text-[#e4efdc]">
              Admin Testing
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Access the administrative dashboard to manage members, configure loans, process payments, and inspect audit logs.
            </p>
          </Link>
        </div>

        <div className="pt-12 text-xs text-slate-500 max-w-md mx-auto space-y-1">
          <p>Google Sheets acts as the database layer for this application.</p>
          <p>Do not upload sensitive personal data, real bank details, or live credit card credentials.</p>
        </div>
      </div>
    </main>
  );
}
