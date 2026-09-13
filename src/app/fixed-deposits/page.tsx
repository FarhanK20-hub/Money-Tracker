'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import FDCard from '@/components/FDCard';
import Modal from '@/components/Modal';
import { addFixedDeposit, updateFixedDepositStatus, addFDTransaction, addTransaction } from '@/lib/firestore';
import { useData } from '@/lib/data-context';
import { FixedDeposit, formatCurrency } from '@/lib/constants';

export default function FixedDepositsPage() {
  return (
    <ProtectedRoute>
      <FDContent />
    </ProtectedRoute>
  );
}

function FDContent() {
  const { fds, loading } = useData();
  const [showNewFD, setShowNewFD] = useState(false);
  const [showInterest, setShowInterest] = useState<FixedDeposit | null>(null);
  const [showMaturity, setShowMaturity] = useState<FixedDeposit | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New FD form state
  const [bankName, setBankName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [fdNotes, setFDNotes] = useState('');

  // Interest form state
  const [interestAmount, setInterestAmount] = useState('');
  const [interestNotes, setInterestNotes] = useState('');

  const resetNewForm = () => {
    setBankName('');
    setPrincipal('');
    setInterestRate('');
    setStartDate('');
    setMaturityDate('');
    setFDNotes('');
  };

  const handleCreateFD = async () => {
    if (!bankName || !principal || !startDate || !maturityDate) return;
    setSubmitting(true);
    try {
      const fdId = await addFixedDeposit({
        bankName,
        principal: parseFloat(principal),
        interestRate: parseFloat(interestRate) || 0,
        startDate: new Date(startDate),
        maturityDate: new Date(maturityDate),
        status: 'active',
        notes: fdNotes,
      });

      // Record the deposit FD transaction (transfer, NOT an expense)
      await addFDTransaction({
        fdId,
        type: 'deposit',
        amount: parseFloat(principal),
        timestamp: new Date(startDate),
        notes: `Initial deposit to ${bankName}`,
      });

      setShowNewFD(false);
      resetNewForm();
    } catch (err) {
      console.error('Create FD error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordMaturity = async (fd: FixedDeposit) => {
    setSubmitting(true);
    try {
      // Mark FD as matured
      await updateFixedDepositStatus(fd.id, 'matured');

      // Record withdrawal (principal back to Available Balance — NOT income)
      await addFDTransaction({
        fdId: fd.id,
        type: 'withdrawal',
        amount: fd.principal,
        timestamp: new Date(),
        notes: `Maturity withdrawal from ${fd.bankName}`,
      });

      setShowMaturity(null);
    } catch (err) {
      console.error('Maturity error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogInterest = async (fd: FixedDeposit) => {
    if (!interestAmount) return;
    setSubmitting(true);
    try {
      const amount = parseFloat(interestAmount);

      // Record FD interest transaction
      await addFDTransaction({
        fdId: fd.id,
        type: 'interest',
        amount,
        timestamp: new Date(),
        notes: interestNotes || `Interest from ${fd.bankName}`,
      });

      // ONLY interest counts as new Business Income
      await addTransaction({
        amount,
        direction: 'credit',
        category: 'business_income',
        rawSender: `FD Interest — ${fd.bankName}`,
        notes: interestNotes || `Interest earned on FD at ${fd.bankName}`,
        source: 'manual',
        timestamp: new Date(),
      });

      setShowInterest(null);
      setInterestAmount('');
      setInterestNotes('');
    } catch (err) {
      console.error('Interest error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const activeFDs = fds.filter((fd) => fd.status === 'active');
  const maturedFDs = fds.filter((fd) => fd.status === 'matured');
  const totalActive = activeFDs.reduce((s, fd) => s + fd.principal, 0);

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/95 backdrop-blur-lg border-b border-zinc-100 px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-800 tracking-tight">Fixed Deposits</h1>
            <p className="text-[11px] text-zinc-400 font-medium">
              {activeFDs.length} active · {formatCurrency(totalActive)} locked
            </p>
          </div>
          <button
            onClick={() => setShowNewFD(true)}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-business-100 text-business-700 border border-business-200 hover:bg-business-200 transition-all active:scale-[0.98]"
          >
            + New FD
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
          </div>
        ) : fds.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <p className="text-base font-semibold text-zinc-700">No fixed deposits</p>
            <p className="text-sm text-zinc-400 mt-1">Tap &quot;+ New FD&quot; to record one</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active FDs */}
            {activeFDs.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-business-600 mb-3">Active</h2>
                <div className="space-y-3">
                  {activeFDs.map((fd, i) => (
                    <div key={fd.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                      <FDCard
                        fd={fd}
                        onRecordMaturity={() => setShowMaturity(fd)}
                        onLogInterest={() => setShowInterest(fd)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Matured FDs */}
            {maturedFDs.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Matured</h2>
                <div className="space-y-3">
                  {maturedFDs.map((fd) => (
                    <FDCard key={fd.id} fd={fd} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* ─── New FD Modal ─── */}
      <Modal isOpen={showNewFD} onClose={() => setShowNewFD(false)} title="New Fixed Deposit">
        <div className="space-y-4">
          <InputField label="Bank Name" value={bankName} onChange={setBankName} placeholder="e.g. SBI, HDFC" />
          <InputField label="Principal Amount (₹)" value={principal} onChange={setPrincipal} type="number" placeholder="100000" />
          <InputField label="Interest Rate (%)" value={interestRate} onChange={setInterestRate} type="number" placeholder="7.5" />
          <InputField label="Start Date" value={startDate} onChange={setStartDate} type="date" />
          <InputField label="Maturity Date" value={maturityDate} onChange={setMaturityDate} type="date" />
          <InputField label="Notes (optional)" value={fdNotes} onChange={setFDNotes} placeholder="Any notes" />

          <p className="text-[11px] text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2">
            ℹ️ This records a <strong>transfer</strong> from Available Balance to FD — it is not an expense and does not reduce Business Profit.
          </p>

          <button
            onClick={handleCreateFD}
            disabled={submitting || !bankName || !principal || !startDate || !maturityDate}
            className="w-full py-3 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create FD'}
          </button>
        </div>
      </Modal>

      {/* ─── Maturity Confirmation Modal ─── */}
      <Modal isOpen={!!showMaturity} onClose={() => setShowMaturity(null)} title="Record Maturity">
        {showMaturity && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Mark <strong>{showMaturity.bankName}</strong> FD as matured? The principal of{' '}
              <strong>{formatCurrency(showMaturity.principal)}</strong> will be moved back to Available Balance.
            </p>
            <p className="text-[11px] text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2">
              ℹ️ Principal returning is <strong>not</strong> new income. Use &quot;Log Interest&quot; separately to record interest earned.
            </p>
            <button
              onClick={() => handleRecordMaturity(showMaturity)}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {submitting ? 'Processing…' : 'Confirm Maturity'}
            </button>
          </div>
        )}
      </Modal>

      {/* ─── Interest Modal ─── */}
      <Modal isOpen={!!showInterest} onClose={() => { setShowInterest(null); setInterestAmount(''); setInterestNotes(''); }} title="Log Interest Earned">
        {showInterest && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Record interest earned on <strong>{showInterest.bankName}</strong> FD.
            </p>
            <InputField label="Interest Amount (₹)" value={interestAmount} onChange={setInterestAmount} type="number" placeholder="5000" />
            <InputField label="Notes (optional)" value={interestNotes} onChange={setInterestNotes} placeholder="e.g. Q3 2026 interest" />
            <p className="text-[11px] text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2">
              ℹ️ Only interest counts as new <strong>Business Income</strong>. The principal never does.
            </p>
            <button
              onClick={() => handleLogInterest(showInterest)}
              disabled={submitting || !interestAmount}
              className="w-full py-3 rounded-xl bg-business-600 text-white text-sm font-semibold hover:bg-business-700 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {submitting ? 'Recording…' : 'Log Interest as Business Income'}
            </button>
          </div>
        )}
      </Modal>

      <BottomNav />
    </div>
  );
}

// ─── Reusable Input Field ──────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-medium placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-800/10 focus:border-zinc-400 transition-all"
      />
    </div>
  );
}
