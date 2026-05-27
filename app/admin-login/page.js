'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PortalAmbientBackdrop from '@/components/theme/PortalAmbientBackdrop';
import {
  portalAuthCardClassName,
  portalAuthShellClassName,
  portalBadgeClassName,
  portalFieldClassName,
  portalPrimaryButtonClassName,
  portalSectionEyebrowClassName,
  portalTopLinkClassName,
} from '@/components/theme/portalTheme';

export default function AdminLoginPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Admin login failed.');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Admin login failed.');
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
        <div className="text-center space-y-2">
          <div className={`${portalBadgeClassName} border-amber-300/20 text-amber-200`}>
            Testing Mode Only
          </div>
          <p className={portalSectionEyebrowClassName}>Admin Workspace</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-stone-50">
            Admin Sign In
          </h2>
          <p className="text-slate-400 text-sm">
            Use the env-configured admin credentials to access the testing dashboard.
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                disabled={isLoading}
                className={portalFieldClassName}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className={portalFieldClassName}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`${portalPrimaryButtonClassName} active:scale-[0.98]`}
            >
              {isLoading ? 'Signing in...' : 'Access Admin Dashboard'}
            </button>
          </form>
        ) : (
          <div className="space-y-4" aria-hidden="true">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Admin Email
              </div>
              <div className="h-[50px] w-full rounded-2xl border border-white/10 bg-slate-950/38" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </div>
              <div className="h-[50px] w-full rounded-2xl border border-white/10 bg-slate-950/38" />
            </div>

            <div className="h-12 w-full rounded-2xl bg-[#d9e7cf]/50" />
          </div>
        )}
      </div>
    </main>
  );
}