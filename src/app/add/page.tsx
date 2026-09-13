'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import { addTransaction } from '@/lib/firestore';
import { TransactionCategory } from '@/lib/constants';

type Direction = 'income' | 'expense';

const INCOME_CATEGORIES: { label: string; value: TransactionCategory }[] = [
  { label: 'Personal Income', value: 'personal_income' },
  { label: 'Business Income', value: 'business_income' },
];

const EXPENSE_CATEGORIES: { label: string; value: TransactionCategory }[] = [
  { label: 'Personal Expense', value: 'personal_expense' },
  { label: 'Business Expense', value: 'business_expense' },
];

export default function AddPage() {
  return (
    <ProtectedRoute>
      <AddContent />
    </ProtectedRoute>
  );
}

function AddContent() {
  const router = useRouter();
  const [direction, setDirection] = useState<Direction>('expense');
  const [category, setCategory] = useState<TransactionCategory>('personal_expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sender, setSender] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = direction === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleDirectionChange = (d: Direction) => {
    setDirection(d);
    setCategory(d === 'income' ? 'personal_income' : 'personal_expense');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    setSubmitting(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        direction: direction === 'income' ? 'credit' : 'debit',
        category,
        rawSender: sender,
        notes,
        source: 'manual',
        timestamp: new Date(date),
      });

      setSuccess(true);
      // Reset form
      setAmount('');
      setSender('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);

      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Add transaction error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/95 backdrop-blur-lg border-b border-zinc-100 px-5 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-zinc-800 tracking-tight">Add Transaction</h1>
          <p className="text-[11px] text-zinc-400 font-medium">Manual entry</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
          {/* Direction Toggle */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDirectionChange('income')}
                className={`py-3 rounded-xl text-sm font-semibold border transition-all active:scale-[0.98] ${
                  direction === 'income'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                ↓ Income
              </button>
              <button
                type="button"
                onClick={() => handleDirectionChange('expense')}
                className={`py-3 rounded-xl text-sm font-semibold border transition-all active:scale-[0.98] ${
                  direction === 'expense'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                ↑ Expense
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const isPersonal = cat.value.includes('personal');
                const isActive = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all active:scale-[0.98] ${
                      isActive
                        ? isPersonal
                          ? 'bg-personal-50 text-personal-700 border-personal-200'
                          : 'bg-business-50 text-business-700 border-business-200'
                        : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-2xl font-bold tabular-nums placeholder:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all"
            />
          </div>

          {/* Sender / Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              {direction === 'income' ? 'From / Sender' : 'To / Description'}
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder={direction === 'income' ? 'Who sent this?' : 'What was this for?'}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-2.5 rounded-lg text-center animate-fade-in-up">
              ✓ Transaction added successfully
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !amount}
            className="w-full py-3.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-zinc-800/20"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding…
              </span>
            ) : (
              'Add Transaction'
            )}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
