'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import AnimatedNumber from '@/components/AnimatedNumber';
import { formatCurrency } from '@/lib/constants';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}

function DonutRing({ pct, color, size = 88 }: { pct: number; color: string; size?: number }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min((pct / 100) * circ, circ);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="11"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
    </svg>
  );
}

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28 px-1">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${Math.max((d.value / max) * 96, d.value > 0 ? 6 : 3)}px`,
              background: d.value > 0 ? `linear-gradient(180deg, ${color}dd, ${color}88)` : 'rgba(255,255,255,0.06)',
              boxShadow: d.value > 0 ? `0 0 12px ${color}40` : 'none',
            }}
          />
          <span className="text-[9px] text-zinc-600 font-medium tracking-wide">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function GlassCard({ children, className = '', gradient }: { children: React.ReactNode; className?: string; gradient?: string }) {
  return (
    <div
      className={`relative rounded-2xl border border-white/8 overflow-hidden ${className}`}
      style={{ background: gradient ?? 'rgba(28,28,30,0.95)' }}
    >
      {children}
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
      style={{ color, borderColor: `${color}40`, background: `${color}15` }}>
      {label}
    </span>
  );
}

function StatRow({ label, value, valueColor = '#e4e4e7', sub }: { label: string; value: string; valueColor?: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold tabular-nums" style={{ color: valueColor }}>{value}</span>
        {sub && <p className="text-[10px] text-zinc-700 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">{children}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function AnalyticsContent() {
  const { transactions, fds, dashboardData: data } = useData();

  const analytics = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const cm = now.getMonth();
    const cy = now.getFullYear();

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(cy, cm - (5 - i), 1);
      const m = d.getMonth(), y = d.getFullYear();
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const txs = transactions.filter(tx => {
        const td = new Date(tx.timestamp);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      return {
        label,
        bizIncome: txs.filter(t => t.category === 'business_income').reduce((s, t) => s + t.amount, 0),
        bizExpenses: txs.filter(t => t.category === 'business_expense').reduce((s, t) => s + t.amount, 0),
        persIncome: txs.filter(t => t.category === 'personal_income').reduce((s, t) => s + t.amount, 0),
      };
    });

    const thisMonth = months[5];
    const lastMonth = months[4];
    const bizGrowth = lastMonth.bizIncome > 0
      ? ((thisMonth.bizIncome - lastMonth.bizIncome) / lastMonth.bizIncome) * 100
      : null;

    const activeFDs = fds.filter(f => f.status === 'active');
    const totalFDMaturity = activeFDs.reduce((s, f) => {
      if (f.maturityAmount) return s + f.maturityAmount;
      const yrs = (new Date(f.maturityDate).getTime() - new Date(f.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return s + f.principal * Math.pow(1 + f.interestRate / 400, 4 * yrs);
    }, 0);
    const totalFDInterest = totalFDMaturity - data.totalFDPrincipal;

    const totalIncome = data.businessIncome + data.personalIncome;
    const totalExpenses = data.businessExpenses + data.personalExpenses;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.min((netSavings / totalIncome) * 100, 100) : 0;

    const totalWealth = data.availableBalance + data.personalBalance + data.totalFDPrincipal;
    const fdPct = totalWealth > 0 ? (data.totalFDPrincipal / totalWealth) * 100 : 0;
    const bizPct = totalWealth > 0 ? (Math.max(0, data.availableBalance) / totalWealth) * 100 : 0;
    const persPct = totalWealth > 0 ? (Math.max(0, data.personalBalance) / totalWealth) * 100 : 0;

    const nextFD = activeFDs
      .filter(f => new Date(f.maturityDate) > now)
      .sort((a, b) => new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime())[0];
    const daysToNextFD = nextFD
      ? Math.ceil((new Date(nextFD.maturityDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return { months, thisMonth, bizGrowth, activeFDs, totalFDMaturity, totalFDInterest, totalIncome, totalExpenses, netSavings, savingsRate, totalWealth, fdPct, bizPct, persPct, nextFD, daysToNextFD };
  }, [transactions, fds, data]);

  if (!data || !analytics) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-zinc-600 text-sm">Add transactions to see analytics.</p>
      </div>
    );
  }

  const { months, thisMonth, bizGrowth, activeFDs, totalFDMaturity, totalFDInterest, totalIncome, totalExpenses, netSavings, savingsRate, totalWealth, fdPct, bizPct, persPct, nextFD, daysToNextFD } = analytics;
  const savingsColor = savingsRate >= 50 ? '#10b981' : savingsRate >= 20 ? '#f59e0b' : '#ef4444';
  const savingsLabel = savingsRate >= 50 ? 'Excellent' : savingsRate >= 20 ? 'Moderate' : 'Low';

  return (
    <div className="min-h-screen pb-32" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-5 pt-5 pb-4" style={{ background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Analytics</h1>
          <p className="text-[11px] text-zinc-600 font-medium mt-0.5 tracking-wide">Full financial picture</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* ── Net Worth Hero ───────────────────────────── */}
        <GlassCard gradient="linear-gradient(135deg, rgba(30,20,0,0.98), rgba(18,18,20,0.98))">
          <div className="p-5">
            <p className="text-[10px] text-amber-600/80 font-bold uppercase tracking-[0.18em] mb-1">Total Net Worth</p>
            <p className="text-4xl font-bold tabular-nums mb-1 flex items-center" style={{ color: '#f5f5f5', letterSpacing: '-0.02em' }}>
              <AnimatedNumber value={totalWealth} />
            </p>
            <p className="text-xs text-zinc-600 mb-5">Liquid + Investments</p>

            {/* Stacked bar */}
            <div className="flex h-2 rounded-full overflow-hidden gap-px mb-4">
              <div style={{ width: `${bizPct}%`, background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} className="rounded-l-full" />
              <div style={{ width: `${persPct}%`, background: 'linear-gradient(90deg, #0d9488, #14b8a6)' }} />
              <div style={{ width: `${fdPct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} className="rounded-r-full" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { dot: '#f59e0b', label: 'Business', val: data.availableBalance, pct: bizPct },
                { dot: '#14b8a6', label: 'Personal', val: data.personalBalance, pct: persPct },
                { dot: '#818cf8', label: 'FDs', val: data.totalFDPrincipal, pct: fdPct },
              ].map(({ dot, label, val, pct }) => (
                <div key={label} className="bg-white/[0.04] rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
                    <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-200 tabular-nums leading-tight">{formatCurrency(val)}</p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">{pct.toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* ── Savings Rate ────────────────────────────── */}
        <SectionLabel>Savings & Efficiency</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="flex flex-col items-center justify-center py-5 px-3">
            <div className="relative flex items-center justify-center mb-3">
              <DonutRing pct={savingsRate} color={savingsColor} />
              <div className="absolute text-center">
                <p className="text-xl font-bold text-zinc-100 leading-none">{savingsRate.toFixed(0)}%</p>
              </div>
            </div>
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Savings Rate</p>
            <Pill label={savingsLabel} color={savingsColor} />
          </GlassCard>

          <GlassCard className="p-4">
            <StatRow label="Income" value={formatCurrency(totalIncome)} valueColor="#f5f5f5" />
            <StatRow label="Expenses" value={formatCurrency(totalExpenses)} valueColor="#f87171" />
            <StatRow label="Saved" value={formatCurrency(netSavings)} valueColor={netSavings >= 0 ? '#34d399' : '#f87171'} />
          </GlassCard>
        </div>

        {/* ── Business Trend ──────────────────────────── */}
        <SectionLabel>Business Income — Last 6 Months</SectionLabel>
        <GlassCard gradient="linear-gradient(135deg, rgba(30,20,0,0.98), rgba(18,18,20,0.98))">
          <div className="p-4">
            <BarChart data={months.map(m => ({ label: m.label, value: m.bizIncome }))} color="#f59e0b" />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">This Month</p>
                <p className="text-xl font-bold tabular-nums flex items-center" style={{ color: '#fbbf24' }}>
                  <AnimatedNumber value={thisMonth.bizIncome} />
                </p>
              </div>
              {bizGrowth !== null && (
                <div className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
                  style={{
                    background: bizGrowth >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                    color: bizGrowth >= 0 ? '#34d399' : '#f87171',
                    border: `1px solid ${bizGrowth >= 0 ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                  }}>
                  {bizGrowth >= 0 ? '↑' : '↓'} {Math.abs(bizGrowth).toFixed(1)}% MoM
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* ── Business Details ────────────────────────── */}
        <SectionLabel>Business Breakdown</SectionLabel>
        <GlassCard className="divide-y divide-white/[0.05]">
          <div className="p-4 space-y-0">
            <StatRow label="Total Income" value={formatCurrency(data.businessIncome)} valueColor="#fbbf24" />
            <StatRow label="Total Expenses" value={formatCurrency(data.businessExpenses)} valueColor="#f87171" />
            <StatRow label="Liquid Profit" value={formatCurrency(data.availableBalance)} valueColor="#34d399" />
            <StatRow label="FDs Locked" value={formatCurrency(data.totalFDPrincipal)} valueColor="#818cf8" />
            <StatRow label="Total Business Wealth" value={formatCurrency(data.businessProfit)} valueColor="#f5f5f5" />
          </div>
        </GlassCard>

        {/* ── Personal Details ────────────────────────── */}
        <SectionLabel>Personal Breakdown</SectionLabel>
        <GlassCard className="p-4">
          <StatRow label="Total Income" value={formatCurrency(data.personalIncome)} valueColor="#2dd4bf" />
          <StatRow label="Total Expenses" value={formatCurrency(data.personalExpenses)} valueColor="#f87171" />
          <StatRow label="Net Balance" value={formatCurrency(data.personalBalance)} valueColor={data.personalBalance >= 0 ? '#34d399' : '#f87171'} />
        </GlassCard>

        {/* ── FD Summary ──────────────────────────────── */}
        <SectionLabel>Fixed Deposit Summary</SectionLabel>
        <GlassCard gradient="linear-gradient(135deg, rgba(15,10,40,0.98), rgba(18,18,20,0.98))">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Principal Locked</p>
                <p className="text-base font-bold tabular-nums text-indigo-400">{formatCurrency(data.totalFDPrincipal)}</p>
              </div>
              <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">At Maturity</p>
                <p className="text-base font-bold tabular-nums text-amber-400">{formatCurrency(totalFDMaturity)}</p>
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] text-emerald-600 uppercase tracking-widest font-bold">Total Interest</p>
                <p className="text-lg font-bold text-emerald-400 tabular-nums">+{formatCurrency(totalFDInterest)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Active FDs</p>
                <p className="text-2xl font-bold text-zinc-200">{activeFDs.length}</p>
              </div>
            </div>
            {nextFD && (
              <div className="bg-white/[0.04] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Next Maturity</p>
                  <p className="text-sm font-semibold text-zinc-200">{new Date(nextFD.maturityDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[10px] text-amber-500 mt-0.5">{daysToNextFD} days away</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Payout</p>
                  <p className="text-sm font-bold text-amber-400 tabular-nums">{formatCurrency(nextFD.maturityAmount ?? nextFD.principal)}</p>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* ── Per-FD Returns ──────────────────────────── */}
        {activeFDs.length > 0 && (
          <>
            <SectionLabel>Per-FD Returns</SectionLabel>
            <div className="space-y-3">
              {activeFDs.map(fd => {
                const yrs = (new Date(fd.maturityDate).getTime() - new Date(fd.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                const matAmt = fd.maturityAmount ?? fd.principal * Math.pow(1 + fd.interestRate / 400, 4 * yrs);
                const interest = matAmt - fd.principal;
                const returnPct = (interest / fd.principal) * 100;
                const daysLeft = Math.max(0, Math.ceil((new Date(fd.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                const progress = Math.min(100, ((yrs * 365.25 - daysLeft) / (yrs * 365.25)) * 100);
                return (
                  <GlassCard key={fd.id} gradient="linear-gradient(135deg, rgba(20,15,40,0.98), rgba(18,18,20,0.98))">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-zinc-100">{fd.bankName}</p>
                          <p className="text-xs text-zinc-600 mt-0.5">{formatCurrency(fd.principal)} · {fd.interestRate}% p.a.</p>
                        </div>
                        <Pill label={`${returnPct.toFixed(1)}% return`} color="#818cf8" />
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-white/[0.06] rounded-full mb-3 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/[0.04] rounded-lg py-2.5 px-2 text-center">
                          <p className="text-[8px] text-zinc-600 uppercase tracking-wider mb-1">At Maturity</p>
                          <p className="text-xs font-bold text-amber-400 tabular-nums">{formatCurrency(matAmt)}</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-lg py-2.5 px-2 text-center">
                          <p className="text-[8px] text-zinc-600 uppercase tracking-wider mb-1">Interest</p>
                          <p className="text-xs font-bold text-emerald-400 tabular-nums">+{formatCurrency(interest)}</p>
                        </div>
                        <div className="bg-white/[0.04] rounded-lg py-2.5 px-2 text-center">
                          <p className="text-[8px] text-zinc-600 uppercase tracking-wider mb-1">Days Left</p>
                          <p className="text-xs font-bold text-zinc-300">{daysLeft}d</p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </>
        )}

      </main>
      <BottomNav />
    </div>
  );
}
