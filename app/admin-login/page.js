'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <main className="flex-grow flex flex-col justify-center items-center bg-slate-950 text-slate-100 p-6 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 backdrop-blur-md">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Testing Mode Only
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-indigo-200">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm disabled:opacity-50"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] disabled:opacity-50"
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
              <div className="h-[50px] w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </div>
              <div className="h-[50px] w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>

            <div className="h-12 w-full rounded-xl bg-purple-600/60" />
          </div>
        )}
      </div>
    </main>
  );
}