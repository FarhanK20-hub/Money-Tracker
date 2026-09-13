'use client';

import { Transaction, CATEGORY_CONFIG, formatCurrency } from '@/lib/constants';

interface TransactionCardProps {
  transaction: Transaction;
  showActions?: boolean;
  onClassifyPersonal?: () => void;
  onClassifyBusiness?: () => void;
}

export default function TransactionCard({
  transaction,
  showActions = false,
  onClassifyPersonal,
  onClassifyBusiness,
}: TransactionCardProps) {
  const config = CATEGORY_CONFIG[transaction.category];
  const isExpense = transaction.category.includes('expense');

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-4 transition-all duration-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category badge */}
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${config.bgColor} ${config.textColor}`}
          >
            {config.label}
          </span>

          {/* Sender / description */}
          <p className="text-sm font-medium text-zinc-800 truncate">
            {transaction.rawSender || 'No description'}
          </p>

          {/* Notes */}
          {transaction.notes && (
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
              {transaction.notes}
            </p>
          )}

          {/* Date */}
          <p className="text-[11px] text-zinc-400 mt-1.5 tabular-nums">
            {transaction.timestamp.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            {' · '}
            {transaction.timestamp.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Amount */}
        <p
          className={`text-lg font-bold tabular-nums whitespace-nowrap ${
            isExpense ? 'text-red-600' : 'text-emerald-600'
          }`}
        >
          {isExpense ? '−' : '+'}
          {formatCurrency(transaction.amount)}
        </p>
      </div>

      {/* Review actions */}
      {showActions && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
          <button
            onClick={onClassifyPersonal}
            className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-personal-50 text-personal-700 border border-personal-200 hover:bg-personal-100 active:scale-[0.98] transition-all duration-150"
          >
            ✓ Personal
          </button>
          <button
            onClick={onClassifyBusiness}
            className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-business-50 text-business-700 border border-business-200 hover:bg-business-100 active:scale-[0.98] transition-all duration-150"
          >
            ✓ Business
          </button>
        </div>
      )}
    </div>
  );
}
