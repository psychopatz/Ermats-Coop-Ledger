// app/page.js
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-grow flex flex-col justify-center items-center bg-radial from-slate-900 via-slate-950 to-black text-slate-100 p-6 relative overflow-hidden">
      {/* Glowing background circles for visual depth */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl w-full text-center z-10 space-y-8">
        {/* Testing Mode Banner */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          Testing MVP Mode
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-300 to-indigo-100">
            Obong ES Coop Ledger
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto">
            A cooperative loan ledger system. Lightweight, responsive, and backed entirely by Google Sheets.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-8">
          {/* Member Card */}
          <Link
            href="/member-login"
            className="group relative block p-8 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900/60 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)] backdrop-blur-md overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none"></div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
              Member Portal
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Log in with your credentials to view your active loans, track payment history, and check your balances.
            </p>
          </Link>

          {/* Admin Card */}
          <Link
            href="/admin-login"
            className="group relative block p-8 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900/60 transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] backdrop-blur-md overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
              Admin Testing
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Access the administrative dashboard to manage members, configure loans, process payments, and inspect audit logs.
            </p>
          </Link>
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-12 text-xs text-slate-500 max-w-md mx-auto space-y-1">
          <p>Google Sheets acts as the database layer for this application.</p>
          <p>Do not upload sensitive personal data, real bank details, or live credit card credentials.</p>
        </div>
      </div>
    </main>
  );
}
