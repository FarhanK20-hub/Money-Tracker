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
      setAmount('');
      setSender('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);

      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error('Add transaction error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="min-h-screen bg-background pb-28 transition-colors">
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
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-white tracking-tight">Add Transaction</h1>
          <p className="text-[10px] font-medium tracking-widest uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manual entry
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">

          {/* Direction Toggle */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['income', 'expense'] as Direction[]).map((d) => {
                const isActive = direction === d;
                const isIncome = d === 'income';
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDirectionChange(d)}
                    className="py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: isActive
                        ? isIncome
                          ? 'rgba(16,185,129,0.12)'
                          : 'rgba(239,68,68,0.12)'
                        : 'rgba(255,255,255,0.03)',
                      border: isActive
                        ? isIncome
                          ? '1px solid rgba(16,185,129,0.35)'
                          : '1px solid rgba(239,68,68,0.35)'
                        : '1px solid rgba(255,255,255,0.06)',
                      color: isActive
                        ? isIncome ? '#34d399' : '#f87171'
                        : 'var(--text-muted)',
                    }}
                  >
                    {isIncome ? '↓ Income' : '↑ Expense'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
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
                    className="py-3 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: isActive
                        ? isPersonal ? 'rgba(20,184,166,0.12)' : 'rgba(245,158,11,0.12)'
                        : 'rgba(255,255,255,0.03)',
                      border: isActive
                        ? isPersonal ? '1px solid rgba(20,184,166,0.35)' : '1px solid rgba(245,158,11,0.35)'
                        : '1px solid rgba(255,255,255,0.06)',
                      color: isActive
                        ? isPersonal ? '#2dd4bf' : '#fbbf24'
                        : 'var(--text-muted)',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount — hero input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Amount
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold select-none"
                style={{ color: 'var(--text-muted)' }}
              >
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-4 rounded-2xl text-3xl font-bold tabular-nums placeholder:opacity-20 focus:outline-none transition-all duration-200"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(201,168,76,0.4)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none transition-all duration-200"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(201,168,76,0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.07)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Sender / Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              {direction === 'income' ? 'From / Sender' : 'To / Description'}
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder={direction === 'income' ? 'Who sent this?' : 'What was this for?'}
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium placeholder:opacity-20 focus:outline-none transition-all duration-200"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(201,168,76,0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.07)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Notes <span className="normal-case font-normal opacity-50">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium placeholder:opacity-20 focus:outline-none transition-all duration-200 resize-none"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(201,168,76,0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.07)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Success */}
          {success && (
            <div
              className="text-xs font-semibold px-4 py-3 rounded-2xl text-center animate-fade-in-up"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#34d399',
              }}
            >
              ✓ Transaction added successfully
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !amount}
            className="w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 active:scale-[0.97] disabled:opacity-30"
            style={{
              background: amount && !submitting
                ? 'linear-gradient(135deg, #c9a84c, #e8c96a, #c9a84c)'
                : 'rgba(201,168,76,0.2)',
              color: amount && !submitting ? '#0a0a0f' : 'rgba(201,168,76,0.5)',
              boxShadow: amount && !submitting
                ? '0 8px 28px rgba(201,168,76,0.3)'
                : 'none',
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
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
