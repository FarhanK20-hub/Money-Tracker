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

  const accentColor = isExpense ? 'rgba(239,68,68,0.7)' : 'rgba(16,185,129,0.7)';

  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
          style={{ background: accentColor }}
        />

        <div className="flex items-start justify-between gap-3 pl-3">
          <div className="flex-1 min-w-0">
            {/* Category badge */}
            <span
              className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${config.bgColor} ${config.textColor}`}
            >
              {config.label}
            </span>

            {/* Sender / description */}
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {transaction.rawSender || 'No description'}
            </p>

            {/* Notes */}
            {transaction.notes && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {transaction.notes}
              </p>
            )}

            {/* Date */}
            <p className="text-[10px] mt-1.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
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
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p
              className={`text-base font-bold tabular-nums whitespace-nowrap ${
                isExpense ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {isExpense ? '−' : '+'}
              {formatCurrency(transaction.amount)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={openEdit}
                className="text-[9px] font-bold uppercase tracking-wider transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Edit
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this transaction?')) {
                      onDelete();
                    }
                  }}
                  className="text-[9px] font-bold uppercase tracking-wider text-red-500/50 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Review actions */}
        {showActions && (
          <div
            className="flex gap-2 mt-3 pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <button
              onClick={onClassifyPersonal}
              className="flex-1 text-xs font-semibold py-2.5 rounded-xl bg-personal-500/10 text-personal-300 border border-personal-500/20 hover:bg-personal-500/20 active:scale-[0.98] transition-all duration-150"
            >
              ✓ Personal
            </button>
            <button
              onClick={onClassifyBusiness}
              className="flex-1 text-xs font-semibold py-2.5 rounded-xl bg-business-500/10 text-business-300 border border-business-500/20 hover:bg-business-500/20 active:scale-[0.98] transition-all duration-150"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
            style={{
              background: 'linear-gradient(145deg, #16161f, #101018)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-8 h-1 rounded-full bg-white/10 mx-auto -mt-1 mb-3" />

            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Edit Transaction</h2>
              <button
                onClick={() => setEditing(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {[
              { label: 'Amount (₹)', type: 'number', value: editAmount, onChange: setEditAmount },
              { label: 'Sender / Description', type: 'text', value: editSender, onChange: setEditSender },
              { label: 'Notes (optional)', type: 'text', value: editNotes, onChange: setEditNotes },
              { label: 'Date & Time', type: 'datetime-local', value: editDate, onChange: setEditDate },
            ].map(({ label, type, value, onChange }) => (
              <div key={label}>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(201,168,76,0.4)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            ))}

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as TransactionCategory)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {EDITABLE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} style={{ background: '#111118' }}>{c.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !editAmount || parseFloat(editAmount) <= 0}
              className="w-full py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all active:scale-[0.97] disabled:opacity-30"
              style={{
                background: 'linear-gradient(135deg, #c9a84c, #e8c96a, #c9a84c)',
                color: '#0a0a0f',
                boxShadow: '0 6px 20px rgba(201,168,76,0.25)',
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
