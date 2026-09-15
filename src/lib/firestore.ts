import { COLLECTIONS, Transaction, FixedDeposit, FDTransaction, TransactionCategory } from '@/lib/constants';
import { syncToGist } from '@/lib/gist-sync';

// A simple utility to trigger updates
export function notifyDataChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('local-data-changed'));
  }
}

function getLocalData<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  if (!data) return [];
  
  return JSON.parse(data, (k, v) => {
    if (['timestamp', 'createdAt', 'reviewedAt', 'startDate', 'maturityDate'].includes(k) && typeof v === 'string') {
      return new Date(v);
    }
    return v;
  });
}

function setLocalData<T>(key: string, data: T[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
    notifyDataChanged();
    // Background sync — fire and forget, never blocks the UI
    syncToGist().catch(() => {});
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// ─── Transactions ────────────────────────────────────────────────────

export async function getTransactions(categoryFilter?: TransactionCategory | 'all'): Promise<Transaction[]> {
  let txs = getLocalData<Transaction>(COLLECTIONS.TRANSACTIONS);
  if (categoryFilter && categoryFilter !== 'all') {
    txs = txs.filter(tx => tx.category === categoryFilter);
  }
  // Sort descending by timestamp
  return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getUnverifiedTransactions(): Promise<Transaction[]> {
  const txs = getLocalData<Transaction>(COLLECTIONS.TRANSACTIONS);
  return txs
    .filter(tx => tx.category === 'unverified_income')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function classifyTransaction(id: string, category: 'personal_income' | 'business_income') {
  const txs = getLocalData<Transaction>(COLLECTIONS.TRANSACTIONS);
  const index = txs.findIndex(tx => tx.id === id);
  if (index !== -1) {
    txs[index].category = category;
    txs[index].reviewedAt = new Date();
    setLocalData(COLLECTIONS.TRANSACTIONS, txs);
  }
}

export async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
  const txs = getLocalData<Transaction>(COLLECTIONS.TRANSACTIONS);
  const id = generateId();
  const newTx: Transaction = {
    ...data,
    id,
    createdAt: new Date(),
  };
  txs.push(newTx);
  setLocalData(COLLECTIONS.TRANSACTIONS, txs);
  return id;
}

export async function deleteTransaction(id: string) {
  let txs = getLocalData<Transaction>(COLLECTIONS.TRANSACTIONS);
  txs = txs.filter(tx => tx.id !== id);
  setLocalData(COLLECTIONS.TRANSACTIONS, txs);
}

export async function updateTransaction(id: string, data: Partial<Pick<Transaction, 'amount' | 'category' | 'rawSender' | 'notes' | 'timestamp'>>) {
  const txs = getLocalData<Transaction>(COLLECTIONS.TRANSACTIONS);
  const index = txs.findIndex(tx => tx.id === id);
  if (index !== -1) {
    txs[index] = { ...txs[index], ...data };
    setLocalData(COLLECTIONS.TRANSACTIONS, txs);
  }
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

  // Calculate total FD principal from active FDs
  const totalFDPrincipal = fds
    .filter((fd) => fd.status === 'active')
    .reduce((sum, fd) => sum + fd.principal, 0);

  // Profit = total business wealth (income + locked FDs - expenses)
  const businessProfit = businessIncome + totalFDPrincipal - businessExpenses;
  // Available = liquid cash only (income - expenses)
  const availableBalance = businessIncome - businessExpenses;

  return {
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

// ─── Fixed Deposits ──────────────────────────────────────────────────

export async function getFixedDeposits(): Promise<FixedDeposit[]> {
  const fds = getLocalData<FixedDeposit>(COLLECTIONS.FIXED_DEPOSITS);
  return fds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getFixedDeposit(id: string): Promise<FixedDeposit | null> {
  const fds = getLocalData<FixedDeposit>(COLLECTIONS.FIXED_DEPOSITS);
  return fds.find(fd => fd.id === id) || null;
}

export async function addFixedDeposit(data: Omit<FixedDeposit, 'id' | 'createdAt'>) {
  const fds = getLocalData<FixedDeposit>(COLLECTIONS.FIXED_DEPOSITS);
  const id = generateId();
  const newFd: FixedDeposit = {
    ...data,
    id,
    createdAt: new Date(),
  };
  fds.push(newFd);
  setLocalData(COLLECTIONS.FIXED_DEPOSITS, fds);
  return id;
}

export async function updateFixedDepositStatus(id: string, status: 'active' | 'matured') {
  const fds = getLocalData<FixedDeposit>(COLLECTIONS.FIXED_DEPOSITS);
  const index = fds.findIndex(fd => fd.id === id);
  if (index !== -1) {
    fds[index].status = status;
    setLocalData(COLLECTIONS.FIXED_DEPOSITS, fds);
  }
}

export async function autoProcessMaturedFDs() {
  const fds = getLocalData<FixedDeposit>(COLLECTIONS.FIXED_DEPOSITS);
  let hasChanges = false;
  const now = new Date();

  for (const fd of fds) {
    if (fd.status === 'active' && new Date(fd.maturityDate) <= now) {
      fd.status = 'matured';
      hasChanges = true;

      // Calculate maturity amount
      const tenureYears = (new Date(fd.maturityDate).getTime() - new Date(fd.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const calculated = fd.principal * Math.pow(1 + fd.interestRate / (4 * 100), 4 * tenureYears);
      const maturityAmount = fd.maturityAmount ?? calculated;
      const interestEarned = maturityAmount - fd.principal;

      // Add transaction for the maturity payout
      const txs = getLocalData<Transaction>(COLLECTIONS.TRANSACTIONS);
      txs.push({
        id: generateId(),
        amount: maturityAmount,
        direction: 'credit',
        category: 'business_income',
        rawSender: `${fd.bankName} FD Maturity`,
        notes: `FD Matured. Principal: ${fd.principal}, Interest: ${Math.round(interestEarned)}`,
        source: 'manual',
        timestamp: new Date(fd.maturityDate),
        createdAt: new Date(),
      });
      localStorage.setItem(COLLECTIONS.TRANSACTIONS, JSON.stringify(txs));
    }
  }

  if (hasChanges) {
    localStorage.setItem(COLLECTIONS.FIXED_DEPOSITS, JSON.stringify(fds));
    notifyDataChanged();
    syncToGist().catch(() => {});
  }
}

export async function deleteFixedDeposit(id: string) {
  let fds = getLocalData<FixedDeposit>(COLLECTIONS.FIXED_DEPOSITS);
  fds = fds.filter(fd => fd.id !== id);
  setLocalData(COLLECTIONS.FIXED_DEPOSITS, fds);
}

// ─── FD Transactions ─────────────────────────────────────────────────

export async function getFDTransactions(fdId: string): Promise<FDTransaction[]> {
  const txs = getLocalData<FDTransaction>(COLLECTIONS.FD_TRANSACTIONS);
  return txs
    .filter(tx => tx.fdId === fdId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addFDTransaction(data: Omit<FDTransaction, 'id' | 'createdAt'>) {
  const txs = getLocalData<FDTransaction>(COLLECTIONS.FD_TRANSACTIONS);
  const id = generateId();
  const newTx: FDTransaction = {
    ...data,
    id,
    createdAt: new Date(),
  };
  txs.push(newTx);
  setLocalData(COLLECTIONS.FD_TRANSACTIONS, txs);
  return id;
}
