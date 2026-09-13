'use client';

import { useData } from '@/lib/data-context';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import StatCard from '@/components/StatCard';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { signOut } = useAuth();
  const { dashboardData: data, loading, error } = useData();

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/95 backdrop-blur-lg border-b border-zinc-100 px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-800 tracking-tight">Money Tracker</h1>
            <p className="text-[11px] text-zinc-400 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-zinc-400 hover:text-zinc-600 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Pending Banner */}
        {data.unverifiedCount > 0 && (
          <Link href="/review" className="block animate-fade-in-up">
            <div className="bg-pending-50 border border-pending-200 rounded-2xl px-4 py-3.5 flex items-center justify-between group hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-pending-100 flex items-center justify-center">
                  <span className="text-pending-600 font-bold text-sm">{data.unverifiedCount}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-pending-700">Unverified Income</p>
                  <p className="text-[11px] text-pending-500">
                    {data.unverifiedCount} transaction{data.unverifiedCount !== 1 ? 's' : ''} awaiting review
                  </p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pending-400 group-hover:translate-x-0.5 transition-transform">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        )}

        {/* ─── Personal Section ─── */}
        <section className="animate-fade-in-up delay-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-personal-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-personal-600">Personal</h2>
          </div>
          <div className="space-y-3">
            <StatCard
              label="Balance"
              amount={data.personalBalance}
              variant="personal"
              size="hero"
            />
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Income" amount={data.personalIncome} variant="personal" />
              <StatCard label="Expenses" amount={data.personalExpenses} variant="personal" />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-[10px] font-medium text-zinc-300 uppercase tracking-widest">Independent Systems</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        {/* ─── Business Section ─── */}
        <section className="animate-fade-in-up delay-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-business-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-business-600">Business</h2>
          </div>
          <div className="space-y-3">
            <StatCard
              label="Profit"
              amount={data.businessProfit}
              variant="business"
              size="hero"
            />
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Income" amount={data.businessIncome} variant="business" />
              <StatCard label="Expenses" amount={data.businessExpenses} variant="business" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Available" amount={data.availableBalance} variant="business" />
              <StatCard label="Fixed Dep." amount={data.totalFDPrincipal} variant="business" />
              <StatCard label="Total" amount={data.totalBusinessMoney} variant="business" />
            </div>
          </div>
        </section>

        {/* Removed manual refresh button since it's real-time now */}
      </main>

      <BottomNav />
    </div>
  );
}
