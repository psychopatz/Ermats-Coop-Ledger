// app/member-login/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PortalAmbientBackdrop from '@/components/theme/PortalAmbientBackdrop';
import {
  portalAuthCardClassName,
  portalAuthShellClassName,
  portalFieldClassName,
  portalPrimaryButtonClassName,
  portalSectionEyebrowClassName,
  portalTopLinkClassName,
} from '@/components/theme/portalTheme';

export default function MemberLogin() {
  const [hasMounted, setHasMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, access_code: accessCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      router.push('/member-dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={portalAuthShellClassName}>
      <PortalAmbientBackdrop />

      <Link
        href="/"
        className={`absolute top-6 left-6 z-10 ${portalTopLinkClassName}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      <div className={`${portalAuthCardClassName} relative z-10 space-y-6`}>
        <div className="text-center portal-fade-up portal-fade-up-delay-1">
          <p className={portalSectionEyebrowClassName}>Member Portal</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-50">
            Member Sign In
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            Enter your email and access code to review your loan records.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex gap-3 items-center">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {hasMounted ? (
          <form onSubmit={handleLogin} className="space-y-4 portal-fade-up portal-fade-up-delay-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                disabled={isLoading}
                className={portalFieldClassName}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Access Code
              </label>
              <input
                type="password"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="••••••"
                disabled={isLoading}
                className={portalFieldClassName}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`${portalPrimaryButtonClassName} flex items-center justify-center gap-2 active:scale-[0.98]`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging in...
                </>
              ) : (
                'Access Portal'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4" aria-hidden="true">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </div>
              <div className="h-[50px] w-full rounded-2xl border border-white/10 bg-slate-950/38" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Access Code
              </div>
              <div className="h-[50px] w-full rounded-2xl border border-white/10 bg-slate-950/38" />
            </div>

            <div className="h-12 w-full rounded-2xl bg-[#d9e7cf]/50" />
          </div>
        )}

        <div className="text-center pt-4 border-t border-white/8 portal-fade-up portal-fade-up-delay-3">
          <p className="text-xs text-slate-500">
            For development testing, check spreadsheet records or create new ones via Admin Dashboard.
          </p>
        </div>
      </div>
    </main>
  );
}
