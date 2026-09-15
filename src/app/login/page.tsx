'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading, error, signInWithPasscode } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [passcode, setPasscode] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await signInWithPasscode(passcode);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-zinc-50">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white font-bold">₹</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">
            Money Tracker
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Personal & Business finance
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-2.5 rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="passcode" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Passcode
            </label>
            <input
              type="password"
              id="passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all duration-200"
              placeholder="Enter your passcode"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !passcode.trim()}
            className="w-full py-3.5 mt-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-zinc-900/20 flex items-center justify-center gap-3"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              'Unlock App'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
