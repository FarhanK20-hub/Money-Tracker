'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import TransactionCard from '@/components/TransactionCard';
import { classifyTransaction } from '@/lib/firestore';
import { useData } from '@/lib/data-context';
import { Transaction } from '@/lib/constants';

export default function ReviewPage() {
  return (
    <ProtectedRoute>
      <ReviewContent />
    </ProtectedRoute>
  );
}

function ReviewContent() {
  const { transactions: allTransactions, loading } = useData();
  const [classifying, setClassifying] = useState<string | null>(null);

  const transactions = allTransactions.filter((tx) => tx.category === 'unverified_income');

  const handleClassify = async (id: string, category: 'personal_income' | 'business_income') => {
    setClassifying(id);
    try {
      await classifyTransaction(id, category);
      // It will automatically disappear because of the real-time listener!
    } catch (err) {
      console.error('Classify error:', err);
    } finally {
      setClassifying(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/95 backdrop-blur-lg border-b border-zinc-100 px-5 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-zinc-800 tracking-tight">Review Queue</h1>
          <p className="text-[11px] text-zinc-400 font-medium">
            {transactions.length} unverified transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-base font-semibold text-zinc-700">All caught up</p>
            <p className="text-sm text-zinc-400 mt-1">No pending reviews</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                className={`animate-fade-in-up ${classifying === tx.id ? 'opacity-50 pointer-events-none' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <TransactionCard
                  transaction={tx}
                  showActions
                  onClassifyPersonal={() => handleClassify(tx.id, 'personal_income')}
                  onClassifyBusiness={() => handleClassify(tx.id, 'business_income')}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
