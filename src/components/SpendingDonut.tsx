'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/constants';

interface SpendingDonutProps {
  personalExpenses: number;
  businessExpenses: number;
  personalIncome: number;
  businessIncome: number;
}

const COLORS = {
  personalIncome: '#0d9488',
  businessIncome: '#d97706',
  personalExpenses: '#0f766e',
  businessExpenses: '#b45309',
};

export default function SpendingDonut({ personalExpenses, businessExpenses, personalIncome, businessIncome }: SpendingDonutProps) {
  const data = [
    { name: 'Personal Income', value: personalIncome, color: COLORS.personalIncome },
    { name: 'Business Income', value: businessIncome, color: COLORS.businessIncome },
    { name: 'Personal Expenses', value: personalExpenses, color: COLORS.personalExpenses },
    { name: 'Business Expenses', value: businessExpenses, color: COLORS.businessExpenses },
  ].filter(d => d.value > 0);

  const total = personalIncome + businessIncome;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-600 mb-2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">No data yet</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/[0.02] rounded-[20px] border border-zinc-100 dark:border-white/5 p-5 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 opacity-80">Money Breakdown</h3>
      <div className="flex items-center gap-5">
        <div className="w-28 h-28 shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                </filter>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                style={{ filter: 'url(#glow)' }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), '']}
                contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--surface-1)', color: 'var(--text-primary)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                <span className="text-[10px] text-zinc-500 truncate">{entry.name}</span>
              </div>
              <span className="text-[11px] font-semibold text-zinc-700 tabular-nums shrink-0">
                {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
