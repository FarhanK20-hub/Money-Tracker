import { collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, addDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS, Transaction, FixedDeposit, FDTransaction, TransactionCategory } from '@/lib/constants';

// ─── Firestore ↔ App converters ─────────────────────────────────────

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  return new Date();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function docToTransaction(id: string, data: any): Transaction {
  return {
    id,
    amount: data.amount ?? 0,
    direction: data.direction ?? 'credit',
    category: data.category ?? 'unverified_income',
    rawSender: data.rawSender ?? '',
    notes: data.notes ?? '',
    source: data.source ?? 'manual',
    timestamp: toDate(data.timestamp),
    createdAt: toDate(data.createdAt),
    reviewedAt: data.reviewedAt ? toDate(data.reviewedAt) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function docToFD(id: string, data: any): FixedDeposit {
  return {
    id,
    bankName: data.bankName ?? '',
    principal: data.principal ?? 0,
    interestRate: data.interestRate ?? 0,
    startDate: toDate(data.startDate),
    maturityDate: toDate(data.maturityDate),
    status: data.status ?? 'active',
    notes: data.notes ?? '',
    createdAt: toDate(data.createdAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function docToFDTransaction(id: string, data: any): FDTransaction {
  return {
    id,
    fdId: data.fdId ?? '',
    type: data.type ?? 'deposit',
    amount: data.amount ?? 0,
    timestamp: toDate(data.timestamp),
    notes: data.notes ?? '',
    createdAt: toDate(data.createdAt),
  };
}

// ─── Transactions ────────────────────────────────────────────────────

export async function getTransactions(categoryFilter?: TransactionCategory | 'all'): Promise<Transaction[]> {
  const colRef = collection(getFirebaseDb(), COLLECTIONS.TRANSACTIONS);
  let q;
  if (categoryFilter && categoryFilter !== 'all') {
    q = query(colRef, where('category', '==', categoryFilter), orderBy('timestamp', 'desc'));
  } else {
    q = query(colRef, orderBy('timestamp', 'desc'));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToTransaction(d.id, d.data()));
}

export async function getUnverifiedTransactions(): Promise<Transaction[]> {
  const colRef = collection(getFirebaseDb(), COLLECTIONS.TRANSACTIONS);
  const q = query(colRef, where('category', '==', 'unverified_income'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToTransaction(d.id, d.data()));
}

export async function classifyTransaction(id: string, category: 'personal_income' | 'business_income') {
  const docRef = doc(getFirebaseDb(), COLLECTIONS.TRANSACTIONS, id);
  await updateDoc(docRef, {
    category,
    reviewedAt: Timestamp.now(),
  });
}

export async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
  const colRef = collection(getFirebaseDb(), COLLECTIONS.TRANSACTIONS);
  const docRef = await addDoc(colRef, {
    ...data,
    timestamp: Timestamp.fromDate(data.timestamp),
    createdAt: Timestamp.now(),
    reviewedAt: data.reviewedAt ? Timestamp.fromDate(data.reviewedAt) : null,
  });
  return docRef.id;
}

export async function deleteTransaction(id: string) {
  const docRef = doc(getFirebaseDb(), COLLECTIONS.TRANSACTIONS, id);
  await deleteDoc(docRef);
}

// ─── Dashboard Aggregation ───────────────────────────────────────────

export interface DashboardData {
  personalIncome: number;
  personalExpenses: number;
  personalBalance: number;
  businessIncome: number;
  businessExpenses: number;
  businessProfit: number;
  totalFDPrincipal: number;
  availableBalance: number;
  totalBusinessMoney: number;
  unverifiedCount: number;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [allTx, fds] = await Promise.all([
    getTransactions('all'),
    getFixedDeposits()
  ]);

  let personalIncome = 0;
  let personalExpenses = 0;
  let businessIncome = 0;
  let businessExpenses = 0;
  let unverifiedCount = 0;

  for (const tx of allTx) {
    switch (tx.category) {
      case 'personal_income':
        personalIncome += tx.amount;
        break;
      case 'personal_expense':
        personalExpenses += tx.amount;
        break;
      case 'business_income':
        businessIncome += tx.amount;
        break;
      case 'business_expense':
        businessExpenses += tx.amount;
        break;
      case 'unverified_income':
        unverifiedCount++;
        break;
    }
  }

  const personalBalance = personalIncome - personalExpenses;
  const businessProfit = businessIncome - businessExpenses;

  // Calculate total FD principal from active FDs
  const totalFDPrincipal = fds
    .filter((fd) => fd.status === 'active')
    .reduce((sum, fd) => sum + fd.principal, 0);

  const availableBalance = businessProfit - totalFDPrincipal;
  const totalBusinessMoney = businessProfit; // Profit = Available + FDs

  return {
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

// ─── Fixed Deposits ──────────────────────────────────────────────────

export async function getFixedDeposits(): Promise<FixedDeposit[]> {
  const colRef = collection(getFirebaseDb(), COLLECTIONS.FIXED_DEPOSITS);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToFD(d.id, d.data()));
}

export async function getFixedDeposit(id: string): Promise<FixedDeposit | null> {
  const docRef = doc(getFirebaseDb(), COLLECTIONS.FIXED_DEPOSITS, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return docToFD(snap.id, snap.data());
}

export async function addFixedDeposit(data: Omit<FixedDeposit, 'id' | 'createdAt'>) {
  const colRef = collection(getFirebaseDb(), COLLECTIONS.FIXED_DEPOSITS);
  const docRef = await addDoc(colRef, {
    ...data,
    startDate: Timestamp.fromDate(data.startDate),
    maturityDate: Timestamp.fromDate(data.maturityDate),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateFixedDepositStatus(id: string, status: 'active' | 'matured') {
  const docRef = doc(getFirebaseDb(), COLLECTIONS.FIXED_DEPOSITS, id);
  await updateDoc(docRef, { status });
}

// ─── FD Transactions ─────────────────────────────────────────────────

export async function getFDTransactions(fdId: string): Promise<FDTransaction[]> {
  const colRef = collection(getFirebaseDb(), COLLECTIONS.FD_TRANSACTIONS);
  const q = query(colRef, where('fdId', '==', fdId), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToFDTransaction(d.id, d.data()));
}

export async function addFDTransaction(data: Omit<FDTransaction, 'id' | 'createdAt'>) {
  const colRef = collection(getFirebaseDb(), COLLECTIONS.FD_TRANSACTIONS);
  const docRef = await addDoc(colRef, {
    ...data,
    timestamp: Timestamp.fromDate(data.timestamp),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}
