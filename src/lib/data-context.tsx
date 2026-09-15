'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Transaction, FixedDeposit } from '@/lib/constants';
import { getTransactions, getFixedDeposits, DashboardData, notifyDataChanged } from '@/lib/firestore';
import { syncFromGist } from '@/lib/gist-sync';
import { useAuth } from '@/lib/auth-context';

interface DataContextType {
  transactions: Transaction[];
  fds: FixedDeposit[];
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  isSyncing: boolean;
}

const DataContext = createContext<DataContextType>({
  transactions: [],
  fds: [],
  dashboardData: null,
  loading: true,
  error: null,
  isSyncing: false,
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fds, setFds] = useState<FixedDeposit[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingFds, setLoadingFds] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransactions([]);
      setFds([]);
      setLoadingTx(false);
      setLoadingFds(false);
      return;
    }

    const loadData = async () => {
      setLoadingTx(true);
      setLoadingFds(true);
      try {
        const [txs, fdsData] = await Promise.all([
          getTransactions('all'),
          getFixedDeposits()
        ]);
        setTransactions(txs);
        setFds(fdsData);
      } catch (err) {
        console.error('Local data load error:', err);
        setError('Failed to load local data');
      } finally {
        setLoadingTx(false);
        setLoadingFds(false);
      }
    };

    // 1. Load from localStorage immediately (instant)
    loadData();

    // 2. Pull from Gist in background — if new data found, reload
    setIsSyncing(true);
    syncFromGist()
      .then((changed) => {
        if (changed) {
          notifyDataChanged();
        }
      })
      .catch(() => {})
      .finally(() => setIsSyncing(false));

    const handleLocalDataChange = () => {
      loadData();
    };

    window.addEventListener('local-data-changed', handleLocalDataChange);

    // ── Drain the server webhook queue into localStorage ──────────────
    const drainWebhookQueue = async () => {
      try {
        const res = await fetch('/api/transactions', {
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY || ''}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const queued = data.queued as Array<Record<string, unknown>>;
        if (!queued || queued.length === 0) return;

        // Merge into localStorage transactions
        const COLLECTIONS_KEY = 'transactions';
        const raw = localStorage.getItem(COLLECTIONS_KEY);
        const existing: unknown[] = raw ? JSON.parse(raw) : [];
        const merged = [...existing, ...queued];
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(merged));
        notifyDataChanged();
      } catch {
        // Silently ignore — offline or not deployed
      }
    };
    drainWebhookQueue();

    return () => {
      window.removeEventListener('local-data-changed', handleLocalDataChange);
    };
  }, [user]);

  // Derive DashboardData synchronously from the real-time cache
  let dashboardData: DashboardData | null = null;
  const isLoading = loadingTx || loadingFds;

  if (!isLoading) {
    let personalIncome = 0;
    let personalExpenses = 0;
    let businessIncome = 0;
    let businessExpenses = 0;
    let unverifiedCount = 0;

    for (const tx of transactions) {
      switch (tx.category) {
        case 'personal_income': personalIncome += tx.amount; break;
        case 'personal_expense': personalExpenses += tx.amount; break;
        case 'business_income': businessIncome += tx.amount; break;
        case 'business_expense': businessExpenses += tx.amount; break;
        case 'unverified_income': unverifiedCount++; break;
      }
    }

    const personalBalance = personalIncome - personalExpenses;
    const businessProfit = businessIncome - businessExpenses;

    const totalFDPrincipal = fds
      .filter((fd) => fd.status === 'active')
      .reduce((sum, fd) => sum + fd.principal, 0);

    const availableBalance = businessProfit - totalFDPrincipal;
    const totalBusinessMoney = businessProfit;

    dashboardData = {
      personalIncome,
      personalExpenses,
      personalBalance,
      businessIncome,
      businessExpenses,
      businessProfit,
      totalFDPrincipal,
      availableBalance,
      totalBusinessMoney,
      unverifiedCount,
    };
  }

  return (
    <DataContext.Provider value={{ transactions, fds, dashboardData, loading: isLoading, error, isSyncing }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
