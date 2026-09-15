'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Transaction, FixedDeposit } from '@/lib/constants';
import { getTransactions, getFixedDeposits, DashboardData, notifyDataChanged, autoProcessMaturedFDs } from '@/lib/firestore';
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
        await autoProcessMaturedFDs();
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

    const handleLocalDataChange = () => {
      loadData();
    };

    // Register listener BEFORE syncing to avoid race conditions
    window.addEventListener('local-data-changed', handleLocalDataChange);

    // 1. Load from localStorage immediately (instant)
    loadData();

    // 2. Pull from Gist in background — if new data found, reload directly
    setIsSyncing(true);
    syncFromGist()
      .then((changed) => {
        if (changed) {
          // Reload directly instead of relying solely on the event
          loadData();
        }
      })
      .catch(() => {})
      .finally(() => setIsSyncing(false));

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

    const totalFDPrincipal = fds
      .filter((fd) => fd.status === 'active')
      .reduce((sum, fd) => sum + fd.principal, 0);

    // Profit = total business wealth (income + locked FDs - expenses)
    const businessProfit = businessIncome + totalFDPrincipal - businessExpenses;
    // Available = liquid cash only (income - expenses, no FDs)
    const availableBalance = businessIncome - businessExpenses;

    dashboardData = {
      personalIncome,
      personalExpenses,
      personalBalance,
      businessIncome,
      businessExpenses,
      businessProfit,
      totalFDPrincipal,
      availableBalance,
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
