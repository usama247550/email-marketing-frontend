'use client';

import { useState } from 'react';
import { loginWithPassword } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('arswift@admin.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithPassword(email.trim(), password);
      router.replace('/');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-1 items-center justify-center theme-surface px-4 py-10">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent text-white shadow-lg shadow-accent/30 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold theme-text-primary tracking-tight">ArSwift Email</h1>
          <p className="text-sm theme-text-secondary mt-1">Sign in to your dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="theme-card border rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
        >
          {error && (
            <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium theme-text-primary mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] text-sm border theme-border rounded-xl theme-select focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="arswift@admin.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium theme-text-primary mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-11 min-h-[44px] text-sm border theme-border rounded-xl theme-select focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg theme-text-muted hover:theme-text-primary theme-hover-surface transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 min-h-[44px] text-sm font-semibold rounded-xl bg-accent hover:bg-accent-hover text-white shadow-sm shadow-accent/30 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs theme-text-muted mt-6">
          Internal ArSwift tool — keep credentials private.
        </p>
      </div>
    </div>
  );
}