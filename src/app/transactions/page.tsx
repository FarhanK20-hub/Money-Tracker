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
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-5 py-4 transition-colors"
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Transactions</h1>
            <p className="text-[10px] font-medium tracking-widest uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {sorted.length} record{sorted.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={sorted.length === 0}
            className="text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-30 uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-muted)' }}
          >
            Export CSV
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Search */}
        <div className="mb-3">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search sender or notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-medium placeholder:opacity-30 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(201,168,76,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {FILTERS.map((f) => {
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="whitespace-nowrap text-[11px] font-bold px-4 py-2 rounded-full transition-all duration-150 uppercase tracking-wider"
                style={{
                  background: isActive ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                  border: isActive ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  color: isActive ? '#c9a84c' : 'var(--text-muted)',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sort controls */}
        <div className="flex gap-2 mb-4">
          {(['date', 'amount'] as const).map((key) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full transition-all uppercase tracking-wider"
              style={{
                background: sortKey === key ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: sortKey === key ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {key === 'date' ? 'Date' : 'Amount'} {sortKey === key && (sortAsc ? '↑' : '↓')}
            </button>
          ))}
        </div>

        {/* Transactions list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[rgba(201,168,76,0.2)] border-t-[#c9a84c] rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 animate-fade-in-up mt-4 rounded-2xl"
            style={{ border: '1px dashed rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.01)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="text-sm font-bold text-white">No transactions</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {filter !== 'all'
                ? `No ${CATEGORY_CONFIG[filter as TransactionCategory]?.label || ''} entries yet`
                : 'Add your first transaction to get started'}
            </p>
          </div>
        ) : (
          <AnimatedList>
            <div className="space-y-2">
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
