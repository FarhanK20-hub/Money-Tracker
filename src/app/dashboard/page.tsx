'use client';

import { useData } from '@/lib/data-context';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import StatCard from '@/components/StatCard';
import SpendingDonut from '@/components/SpendingDonut';
import TransactionCard from '@/components/TransactionCard';
import { deleteTransaction } from '@/lib/firestore';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { signOut } = useAuth();
  const { dashboardData: data, transactions: allTransactions, loading, error, isSyncing } = useData();

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
    <div className="min-h-screen bg-zinc-50 dark:bg-background pb-24 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/95 dark:bg-background/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-5 py-4 transition-colors">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Money Tracker</h1>
              {isSyncing && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-personal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-personal-500" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            onClick={signOut}
            className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 font-semibold transition-colors px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-95"
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
          <div className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Independent Systems</span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
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
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Available" amount={data.availableBalance} variant="business" size="compact" />
              <StatCard label="Fixed Dep." amount={data.totalFDPrincipal} variant="business" size="compact" />
            </div>
          </div>
        </section>

        {/* Removed manual refresh button since it's real-time now */}

        {/* ─── Spending Breakdown Chart ─── */}
        <section className="animate-fade-in-up delay-4">
          <SpendingDonut
            personalIncome={data.personalIncome}
            businessIncome={data.businessIncome}
            personalExpenses={data.personalExpenses}
            businessExpenses={data.businessExpenses}
          />
        </section>

        {/* ─── Recent Activity ─── */}
        {(() => {
          const recentTxs = [...allTransactions]
            .filter(tx => tx.category !== 'unverified_income')
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5);
          if (recentTxs.length === 0) return null;
          return (
            <section className="animate-fade-in-up delay-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent Activity</h2>
                <Link href="/transactions" className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-700 transition-colors">
                  See all →
                </Link>
              </div>
              <div className="space-y-2.5">
                {recentTxs.map(tx => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    onDelete={() => deleteTransaction(tx.id)}
                  />
                ))}
              </div>
            </section>
          );
        })()}
      </main>

      <BottomNav />
    </div>
  );
}
