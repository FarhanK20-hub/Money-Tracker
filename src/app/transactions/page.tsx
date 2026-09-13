'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import TransactionCard from '@/components/TransactionCard';
import { useData } from '@/lib/data-context';
import { TransactionCategory, CATEGORY_CONFIG } from '@/lib/constants';

const FILTERS: { label: string; value: TransactionCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Personal In', value: 'personal_income' },
  { label: 'Business In', value: 'business_income' },
  { label: 'Personal Out', value: 'personal_expense' },
  { label: 'Business Out', value: 'business_expense' },
];

type SortKey = 'date' | 'amount';

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <TransactionsContent />
    </ProtectedRoute>
  );
}

function TransactionsContent() {
  const { transactions: allTransactions, loading } = useData();
  const [filter, setFilter] = useState<TransactionCategory | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter out unverified income from main log, and apply category filter
  const transactions = allTransactions.filter(
    (tx) => tx.category !== 'unverified_income' && (filter === 'all' || tx.category === filter)
  );

  const sorted = [...transactions].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'date') {
      cmp = b.timestamp.getTime() - a.timestamp.getTime();
    } else {
      cmp = b.amount - a.amount;
    }
    return sortAsc ? -cmp : cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/95 backdrop-blur-lg border-b border-zinc-100 px-5 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-zinc-800 tracking-tight">Transactions</h1>
          <p className="text-[11px] text-zinc-400 font-medium">
            {sorted.length} record{sorted.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap text-xs font-semibold px-3.5 py-2 rounded-full border transition-all duration-150 ${
                filter === f.value
                  ? 'bg-zinc-800 text-white border-zinc-800'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleSort('date')}
            className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              sortKey === 'date' ? 'bg-zinc-100 text-zinc-700' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Date {sortKey === 'date' && (sortAsc ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('amount')}
            className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              sortKey === 'amount' ? 'bg-zinc-100 text-zinc-700' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Amount {sortKey === 'amount' && (sortAsc ? '↑' : '↓')}
          </button>
        </div>

        {/* Transactions list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <p className="text-base font-semibold text-zinc-700">No transactions</p>
            <p className="text-sm text-zinc-400 mt-1">
              {filter !== 'all'
                ? `No ${CATEGORY_CONFIG[filter as TransactionCategory]?.label || ''} entries yet`
                : 'Add your first transaction to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((tx, i) => (
              <div
                key={tx.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
              >
                <TransactionCard transaction={tx} />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
