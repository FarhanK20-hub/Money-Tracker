'use client';

import { useEffect, useState } from 'react';
import { FixedDeposit, formatCurrency } from '@/lib/constants';

interface FDCardProps {
  fd: FixedDeposit;
  onRecordMaturity?: () => void;
  onLogInterest?: () => void;
  onDelete?: () => void;
}

export default function FDCard({ fd, onRecordMaturity, onLogInterest, onDelete }: FDCardProps) {
  const isActive = fd.status === 'active';
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  const daysLeft = now !== null 
    ? Math.ceil((fd.maturityDate.getTime() - now) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        isActive
          ? 'bg-[#1a1500] border-business-700/60'
          : 'bg-zinc-900 border-zinc-700 opacity-75'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-zinc-100 text-sm">{fd.bankName}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {fd.startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
            {' → '}
            {fd.maturityDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-700 text-zinc-400'
            }`}
          >
            {isActive ? 'Active' : 'Matured'}
          </span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this FD?')) {
                  onDelete();
                }
              }}
              className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wider"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Principal</p>
          <p className="text-lg font-bold text-zinc-100 tabular-nums">
            {formatCurrency(fd.principal)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Rate</p>
          <p className="text-lg font-bold text-zinc-100 tabular-nums">
            {fd.interestRate}% p.a.
          </p>
        </div>
      </div>

      {/* Maturity Amount */}
      {(() => {
        const tenureYears = (fd.maturityDate.getTime() - fd.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const calculated = fd.principal * Math.pow(1 + fd.interestRate / (4 * 100), 4 * tenureYears);
        // Use bank-confirmed value if stored, otherwise use calculated
        const maturityAmount = fd.maturityAmount ?? calculated;
        const interestEarned = maturityAmount - fd.principal;
        return (
          <div className="bg-white/5 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">At Maturity</p>
              <p className="text-base font-bold text-amber-300 tabular-nums">{formatCurrency(maturityAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Interest</p>
              <p className="text-base font-semibold text-emerald-400 tabular-nums">+{formatCurrency(interestEarned)}</p>
            </div>
          </div>
        );
      })()}

      {isActive && daysLeft > 0 && (
        <p className="text-[11px] text-amber-400 font-medium mb-3">
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} to maturity
        </p>
      )}

      {fd.notes && (
        <p className="text-xs text-zinc-400 mb-3 truncate">{fd.notes}</p>
      )}

    </div>
  );
}
