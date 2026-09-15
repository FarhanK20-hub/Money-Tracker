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
      className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-sm ${
        isActive
          ? 'bg-business-50/40 border-business-200'
          : 'bg-zinc-50 border-zinc-200 opacity-75'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-zinc-800 text-sm">{fd.bankName}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {fd.startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' → '}
            {fd.maturityDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              isActive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-zinc-100 text-zinc-500'
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
              className="text-[10px] text-zinc-400 hover:text-red-600 transition-colors uppercase font-bold tracking-wider"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Principal</p>
          <p className="text-lg font-bold text-zinc-800 tabular-nums">
            {formatCurrency(fd.principal)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Rate</p>
          <p className="text-lg font-bold text-zinc-800 tabular-nums">
            {fd.interestRate}%
          </p>
        </div>
      </div>

      {isActive && daysLeft > 0 && (
        <p className="text-[11px] text-business-600 font-medium mb-3">
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} to maturity
        </p>
      )}

      {fd.notes && (
        <p className="text-xs text-zinc-400 mb-3 truncate">{fd.notes}</p>
      )}

      {isActive && (
        <div className="flex gap-2 pt-3 border-t border-zinc-100">
          <button
            onClick={onRecordMaturity}
            className="flex-1 text-xs font-semibold py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 active:scale-[0.98] transition-all duration-150"
          >
            Record Maturity
          </button>
          <button
            onClick={onLogInterest}
            className="flex-1 text-xs font-semibold py-2 rounded-lg bg-business-100 text-business-700 hover:bg-business-200 active:scale-[0.98] transition-all duration-150"
          >
            Log Interest
          </button>
        </div>
      )}
    </div>
  );
}
