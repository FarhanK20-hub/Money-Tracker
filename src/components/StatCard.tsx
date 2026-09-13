'use client';

import { formatCurrency } from '@/lib/constants';

interface StatCardProps {
  label: string;
  amount: number;
  variant: 'personal' | 'business' | 'neutral' | 'pending';
  size?: 'default' | 'hero';
  prefix?: string;
  className?: string;
}

const variantStyles = {
  personal: {
    border: 'border-personal-200',
    bg: 'bg-personal-50/60',
    label: 'text-personal-700',
    amount: 'text-personal-800',
    icon: 'bg-personal-100 text-personal-600',
  },
  business: {
    border: 'border-business-200',
    bg: 'bg-business-50/60',
    label: 'text-business-700',
    amount: 'text-business-800',
    icon: 'bg-business-100 text-business-600',
  },
  neutral: {
    border: 'border-zinc-200',
    bg: 'bg-white',
    label: 'text-zinc-500',
    amount: 'text-zinc-900',
    icon: 'bg-zinc-100 text-zinc-500',
  },
  pending: {
    border: 'border-pending-200',
    bg: 'bg-pending-50/60',
    label: 'text-pending-700',
    amount: 'text-pending-700',
    icon: 'bg-pending-100 text-pending-600',
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
      className={`rounded-2xl border ${s.border} ${s.bg} p-4 transition-all duration-200 hover:shadow-sm ${className}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wider ${s.label} mb-1`}>
        {prefix && <span className="mr-1">{prefix}</span>}
        {label}
      </p>
      <p
        className={`tabular-nums font-bold ${s.amount} ${
          size === 'hero' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
        } leading-tight`}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
