'use client';

import { formatCurrency } from '@/lib/constants';

interface StatCardProps {
  label: string;
  amount: number;
  variant: 'personal' | 'business' | 'neutral' | 'pending';
  size?: 'default' | 'hero' | 'compact';
  prefix?: string;
  className?: string;
}

const variantStyles = {
  personal: {
    border: 'border-personal-200 dark:border-personal-500/30',
    bg: 'bg-gradient-to-br from-personal-50 to-personal-100/50 dark:from-personal-500/20 dark:to-personal-500/10',
    label: 'text-personal-600 dark:text-personal-400',
    amount: 'text-personal-900 dark:text-personal-50',
    glow: 'shadow-[0_0_30px_rgba(20,184,166,0.1)]',
  },
  business: {
    border: 'border-business-200 dark:border-business-500/30',
    bg: 'bg-gradient-to-br from-business-50 to-business-100/50 dark:from-business-500/20 dark:to-business-500/10',
    label: 'text-business-600 dark:text-business-400',
    amount: 'text-business-900 dark:text-business-50',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]',
  },
  neutral: {
    border: 'border-zinc-200 dark:border-white/10',
    bg: 'bg-white dark:bg-white/[0.04]',
    label: 'text-zinc-500 dark:text-zinc-400',
    amount: 'text-zinc-900 dark:text-zinc-50',
    glow: 'shadow-sm',
  },
  pending: {
    border: 'border-pending-200 dark:border-pending-500/30',
    bg: 'bg-gradient-to-br from-pending-50 to-pending-100/50 dark:from-pending-500/20 dark:to-pending-500/10',
    label: 'text-pending-600 dark:text-pending-400',
    amount: 'text-pending-900 dark:text-pending-50',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.1)]',
  },
};

export default function StatCard({
  label,
  amount,
  variant,
  size = 'default',
  prefix,
  className = '',
}: StatCardProps) {
  const s = variantStyles[variant];

  return (
    <div
      className={`rounded-[20px] border ${s.border} ${s.bg} p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${s.glow} ${className}`}
    >
      <p className={`text-[11px] font-bold uppercase tracking-widest ${s.label} mb-1.5 opacity-90`}>
        {prefix && <span className="mr-1 opacity-70">{prefix}</span>}
        {label}
      </p>
      <p
        className={`tabular-nums font-bold ${s.amount} ${
          size === 'hero' ? 'text-3xl sm:text-4xl'
          : size === 'compact' ? 'text-base sm:text-lg'
          : 'text-xl sm:text-2xl'
        } leading-tight`}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
