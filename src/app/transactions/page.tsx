'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import TransactionCard from '@/components/TransactionCard';
import { useData } from '@/lib/data-context';
import { deleteTransaction } from '@/lib/firestore';
import { TransactionCategory, CATEGORY_CONFIG } from '@/lib/constants';
import { AnimatedList, AnimatedItem } from '@/components/motion';

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

  const [searchQuery, setSearchQuery] = useState('');

  // Filter out unverified income from main log, and apply category filter and search
  const transactions = allTransactions.filter((tx) => {
    if (tx.category === 'unverified_income') return false;
    if (filter !== 'all' && tx.category !== filter) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSender = tx.rawSender?.toLowerCase().includes(q) || false;
      const matchesNotes = tx.notes?.toLowerCase().includes(q) || false;
      if (!matchesSender && !matchesNotes) return false;
    }
    
    return true;
  });

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

  const handleExportCSV = () => {
    if (sorted.length === 0) return;
    const headers = ['Date', 'Amount', 'Category', 'Direction', 'Sender', 'Notes'];
    const rows = sorted.map(tx => [
      tx.timestamp.toISOString(),
      tx.amount.toString(),
      tx.category,
      tx.direction,
      `"${tx.rawSender.replace(/"/g, '""')}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-background pb-24 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/95 dark:bg-background/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-5 py-4 transition-colors">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Transactions</h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
              {sorted.length} record{sorted.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={sorted.length === 0}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors disabled:opacity-50 active:scale-95"
          >
            Export CSV
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-4">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search sender or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all shadow-sm"
            />
          </div>
        </div>

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
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up mt-8 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-600 mb-4">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="text-base font-bold text-zinc-700 dark:text-zinc-300">No transactions</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              {filter !== 'all'
                ? `No ${CATEGORY_CONFIG[filter as TransactionCategory]?.label || ''} entries yet`
                : 'Add your first transaction to get started'}
            </p>
          </div>
        ) : (
          <AnimatedList>
            <div className="space-y-2.5">
              {sorted.map((tx, i) => (
                <AnimatedItem key={tx.id} index={i} layoutId={tx.id}>
                  <TransactionCard
                    transaction={tx}
                    onDelete={() => deleteTransaction(tx.id)}
                  />
                </AnimatedItem>
              ))}
            </div>
          </AnimatedList>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
