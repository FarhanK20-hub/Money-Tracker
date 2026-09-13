'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS, Transaction, FixedDeposit } from '@/lib/constants';
import { docToTransaction, docToFD, DashboardData } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';

interface DataContextType {
  transactions: Transaction[];
  fds: FixedDeposit[];
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType>({
  transactions: [],
  fds: [],
  dashboardData: null,
  loading: true,
  error: null,
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fds, setFds] = useState<FixedDeposit[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingFds, setLoadingFds] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setFds([]);
      setLoadingTx(false);
      setLoadingFds(false);
      return;
    }

    setLoadingTx(true);
    setLoadingFds(true);
    const db = getFirebaseDb();

    // 1. Listen to Transactions
    const txQuery = query(collection(db, COLLECTIONS.TRANSACTIONS), orderBy('timestamp', 'desc'));
    const unsubTx = onSnapshot(txQuery, (snap) => {
      const txs = snap.docs.map((d) => docToTransaction(d.id, d.data()));
      setTransactions(txs);
      setLoadingTx(false);
    }, (err) => {
      console.error('Tx listener error:', err);
      setError('Failed to load transactions');
      setLoadingTx(false);
    });

    // 2. Listen to Fixed Deposits
    const fdQuery = query(collection(db, COLLECTIONS.FIXED_DEPOSITS), orderBy('createdAt', 'desc'));
    const unsubFd = onSnapshot(fdQuery, (snap) => {
      const fdList = snap.docs.map((d) => docToFD(d.id, d.data()));
      setFds(fdList);
      setLoadingFds(false);
    }, (err) => {
      console.error('FD listener error:', err);
      setError('Failed to load fixed deposits');
      setLoadingFds(false);
    });

    return () => {
      unsubTx();
      unsubFd();
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
    <DataContext.Provider value={{ transactions, fds, dashboardData, loading: isLoading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
