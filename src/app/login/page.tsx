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
  const [focused, setFocused] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#111118] border border-[rgba(201,168,76,0.3)] flex items-center justify-center animate-gold-pulse">
            <span className="text-lg gold-text font-bold">₹</span>
          </div>
          <div className="w-5 h-5 border-2 border-[rgba(201,168,76,0.2)] border-t-[#c9a84c] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0f] relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201, 168, 76, 0.07) 0%, transparent 70%)',
        }}
      />
      {/* Bottom noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="relative inline-flex mb-5">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-3xl animate-gold-pulse"
              style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, transparent 70%)', transform: 'scale(1.8)' }}
            />
            <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center border border-[rgba(201,168,76,0.35)] shadow-[0_0_40px_rgba(201,168,76,0.15)]"
              style={{ background: 'linear-gradient(145deg, #15151e, #0e0e15)' }}>
              <span className="text-4xl gold-text font-bold leading-none select-none">₹</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Money Tracker
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Personal &amp; Business finance
          </p>
        </div>

        {/* Form */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Top edge light */}
          <div
            className="absolute top-0 left-8 right-8 h-px rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}
          />

          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-4 py-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="passcode" className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="w-full px-4 py-3.5 rounded-2xl text-white text-sm font-medium placeholder:text-[#3a3a44] focus:outline-none transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: focused
                      ? '1px solid rgba(201,168,76,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: focused
                      ? '0 0 0 3px rgba(201,168,76,0.08), 0 0 20px rgba(201,168,76,0.05)'
                      : 'none',
                  }}
                  placeholder="Enter your passcode"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !passcode.trim()}
              className="w-full py-3.5 mt-1 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{
                background: passcode.trim() && !submitting
                  ? 'linear-gradient(135deg, #c9a84c, #e8c96a, #c9a84c)'
                  : 'rgba(201,168,76,0.3)',
                color: passcode.trim() && !submitting ? '#0a0a0f' : 'rgba(201,168,76,0.6)',
                boxShadow: passcode.trim() && !submitting
                  ? '0 8px 24px rgba(201,168,76,0.3), 0 2px 4px rgba(0,0,0,0.4)'
                  : 'none',
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                  Unlocking…
                </span>
              ) : (
                'Unlock App'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Your financial data stays private
        </p>
      </div>
    </div>
  );
}
