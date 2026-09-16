'use client';

import { formatCurrency } from '@/lib/constants';
import AnimatedNumber from '@/components/AnimatedNumber';

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
    border: 'border-personal-500/20',
    bg: 'from-personal-500/[0.12] to-personal-500/[0.05]',
    label: 'text-personal-400',
    amount: 'text-personal-50',
    glow: 'shadow-[0_0_40px_rgba(20,184,166,0.08)]',
    topBar: 'from-personal-500/60 via-personal-400/40 to-transparent',
    heroBg: 'from-personal-500/[0.15] to-personal-500/[0.04]',
  },
  business: {
    border: 'border-business-500/20',
    bg: 'from-business-500/[0.12] to-business-500/[0.05]',
    label: 'text-business-400',
    amount: 'text-business-50',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.08)]',
    topBar: 'from-business-500/60 via-business-400/40 to-transparent',
    heroBg: 'from-business-500/[0.15] to-business-500/[0.04]',
  },
  neutral: {
    border: 'border-white/[0.06]',
    bg: 'from-white/[0.04] to-white/[0.01]',
    label: 'text-zinc-400',
    amount: 'text-zinc-50',
    glow: 'shadow-sm',
    topBar: 'from-white/20 via-white/10 to-transparent',
    heroBg: 'from-white/[0.06] to-white/[0.01]',
  },
  pending: {
    border: 'border-pending-500/20',
    bg: 'from-pending-500/[0.12] to-pending-500/[0.05]',
    label: 'text-pending-400',
    amount: 'text-pending-50',
    glow: 'shadow-[0_0_40px_rgba(249,115,22,0.08)]',
    topBar: 'from-pending-500/60 via-pending-400/40 to-transparent',
    heroBg: 'from-pending-500/[0.15] to-pending-500/[0.04]',
  },
};

// Light mode overrides
const lightVariantStyles = {
  personal: {
    border: 'border-personal-200',
    bg: 'from-personal-50 to-personal-100/40',
    label: 'text-personal-600',
    amount: 'text-personal-900',
  },
  business: {
    border: 'border-business-200',
    bg: 'from-business-50 to-business-100/40',
    label: 'text-business-600',
    amount: 'text-business-900',
  },
  neutral: {
    border: 'border-zinc-200',
    bg: 'from-white to-zinc-50/50',
    label: 'text-zinc-500',
    amount: 'text-zinc-900',
  },
  pending: {
    border: 'border-pending-200',
    bg: 'from-pending-50 to-pending-100/40',
    label: 'text-pending-600',
    amount: 'text-pending-900',
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
  const ls = lightVariantStyles[variant];
  const isHero = size === 'hero';

  return (
    <div
      className={`
        relative overflow-hidden rounded-[20px] border transition-all duration-300
        hover:scale-[1.02] active:scale-[0.98]
        bg-gradient-to-br ${s.bg} ${s.glow} ${s.border}
        dark:${s.bg} dark:${s.border}
        ${ls.bg} ${ls.border}
        ${isHero ? 'p-5' : 'p-4'}
        ${className}
      `}
    >
      {/* Top-edge light streak */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${s.topBar} opacity-60 dark:opacity-100`} />

      {/* Hero: subtle left accent bar */}
      {isHero && (
        <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b ${s.topBar} opacity-70`} />
      )}

      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-80 ${ls.label} dark:${s.label}`}>
        {prefix && <span className="mr-1 opacity-70">{prefix}</span>}
        {label}
      </p>
      <p
        className={`tabular-nums font-bold ${ls.amount} dark:${s.amount} ${
          isHero ? 'text-3xl sm:text-4xl'
          : size === 'compact' ? 'text-base sm:text-lg'
          : 'text-xl sm:text-2xl'
        } leading-tight`}
      >
        <AnimatedNumber value={amount} />
      </p>
    </div>
  );
}
