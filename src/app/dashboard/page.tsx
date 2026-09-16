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
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function DashboardContent() {
  const { signOut } = useAuth();
  const { dashboardData: data, transactions: allTransactions, loading, error, isSyncing } = useData();

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center animate-gold-pulse"
            style={{
              background: 'linear-gradient(145deg, #15151e, #0e0e15)',
              border: '1px solid rgba(201,168,76,0.3)',
            }}
          >
            <span className="text-lg gold-text font-bold">₹</span>
          </div>
          <div className="w-5 h-5 border-2 border-[rgba(201,168,76,0.2)] border-t-[#c9a84c] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-red-400 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 transition-colors">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-5 py-4 transition-colors"
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(145deg, #1a1a24, #12121a)',
                border: '1px solid rgba(201,168,76,0.3)',
                boxShadow: '0 0 12px rgba(201,168,76,0.1)',
              }}
            >
              <span className="text-sm gold-text font-bold leading-none">₹</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">{getGreeting()}</h1>
                {isSyncing && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a84c] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#c9a84c]" />
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="text-[11px] font-semibold transition-all px-3 py-1.5 rounded-full active:scale-95"
              style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Pending Banner */}
        {data.unverifiedCount > 0 && (
          <Link href="/review" className="block animate-fade-in-up">
            <div
              className="rounded-2xl px-4 py-3.5 flex items-center justify-between group transition-all"
              style={{
                background: 'rgba(249,115,22,0.08)',
                border: '1px solid rgba(249,115,22,0.2)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pending-500/20 flex items-center justify-center">
                  <span className="text-pending-400 font-bold text-xs">{data.unverifiedCount}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-pending-300">Unverified Income</p>
                  <p className="text-[11px] text-pending-500">
                    {data.unverifiedCount} transaction{data.unverifiedCount !== 1 ? 's' : ''} awaiting review
                  </p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pending-500 group-hover:translate-x-0.5 transition-transform">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        )}

        {/* ─── Personal Section ─── */}
        <section className="animate-fade-in-up delay-1">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-personal-400" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-personal-400">Personal</h2>
          </div>
          <div className="space-y-2.5">
            <StatCard label="Balance" amount={data.personalBalance} variant="personal" size="hero" />
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard label="Income" amount={data.personalIncome} variant="personal" />
              <StatCard label="Expenses" amount={data.personalExpenses} variant="personal" />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Independent Systems
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* ─── Business Section ─── */}
        <section className="animate-fade-in-up delay-3">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-business-400" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-business-400">Business</h2>
          </div>
          <div className="space-y-2.5">
            <StatCard label="Profit" amount={data.businessProfit} variant="business" size="hero" />
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard label="Income" amount={data.businessIncome} variant="business" />
              <StatCard label="Expenses" amount={data.businessExpenses} variant="business" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard label="Available" amount={data.availableBalance} variant="business" size="compact" />
              <StatCard label="Fixed Dep." amount={data.totalFDPrincipal} variant="business" size="compact" />
            </div>
          </div>
        </section>

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
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                  Recent Activity
                </h2>
                <Link
                  href="/transactions"
                  className="text-[11px] font-semibold transition-colors"
                  style={{ color: '#c9a84c' }}
                >
                  See all →
                </Link>
              </div>
              <div className="space-y-2">
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
