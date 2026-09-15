'use client';

import { useState } from 'react';
import { Transaction, CATEGORY_CONFIG, TransactionCategory, formatCurrency } from '@/lib/constants';
import { updateTransaction } from '@/lib/firestore';

interface TransactionCardProps {
  transaction: Transaction;
  showActions?: boolean;
  onClassifyPersonal?: () => void;
  onClassifyBusiness?: () => void;
  onDelete?: () => void;
}

const EDITABLE_CATEGORIES: { label: string; value: TransactionCategory }[] = [
  { label: 'Personal Income', value: 'personal_income' },
  { label: 'Business Income', value: 'business_income' },
  { label: 'Personal Expense', value: 'personal_expense' },
  { label: 'Business Expense', value: 'business_expense' },
  { label: 'Unverified', value: 'unverified_income' },
];

export default function TransactionCard({
  transaction,
  showActions = false,
  onClassifyPersonal,
  onClassifyBusiness,
  onDelete,
}: TransactionCardProps) {
  const config = CATEGORY_CONFIG[transaction.category];
  const isExpense = transaction.category.includes('expense');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editAmount, setEditAmount] = useState(transaction.amount.toString());
  const [editCategory, setEditCategory] = useState<TransactionCategory>(transaction.category);
  const [editSender, setEditSender] = useState(transaction.rawSender || '');
  const [editNotes, setEditNotes] = useState(transaction.notes || '');
  const [editDate, setEditDate] = useState(
    transaction.timestamp instanceof Date
      ? transaction.timestamp.toISOString().slice(0, 16)
      : new Date(transaction.timestamp).toISOString().slice(0, 16)
  );

  const openEdit = () => {
    setEditAmount(transaction.amount.toString());
    setEditCategory(transaction.category);
    setEditSender(transaction.rawSender || '');
    setEditNotes(transaction.notes || '');
    setEditDate(
      transaction.timestamp instanceof Date
        ? transaction.timestamp.toISOString().slice(0, 16)
        : new Date(transaction.timestamp).toISOString().slice(0, 16)
    );
    setEditing(true);
  };

  const handleSave = async () => {
    const amount = parseFloat(editAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await updateTransaction(transaction.id, {
        amount,
        category: editCategory,
        rawSender: editSender,
        notes: editNotes,
        timestamp: new Date(editDate),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-white/[0.02] rounded-[20px] border border-zinc-100 dark:border-white/5 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-200/20 dark:hover:shadow-black/50 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Category badge */}
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 ${config.bgColor} ${config.textColor} shadow-sm`}
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

          {/* Amount & Actions */}
          <div className="flex flex-col items-end gap-2">
            <p
              className={`text-lg font-bold tabular-nums whitespace-nowrap ${
                isExpense ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {isExpense ? '−' : '+'}
              {formatCurrency(transaction.amount)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={openEdit}
                className="text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors uppercase font-bold tracking-wider"
              >
                Edit
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this entry?')) {
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

      {/* ─── Edit Modal ─── */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setEditing(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-zinc-800">Edit Transaction</h2>
              <button
                onClick={() => setEditing(false)}
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as TransactionCategory)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all"
              >
                {EDITABLE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Sender */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Sender / Description</label>
              <input
                type="text"
                value={editSender}
                onChange={(e) => setEditSender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all"
              />
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Date & Time</label>
              <input
                type="datetime-local"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !editAmount || parseFloat(editAmount) <= 0}
              className="w-full py-3 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
