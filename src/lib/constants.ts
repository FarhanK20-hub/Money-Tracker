// ─── Transaction Types ───────────────────────────────────────────────

export type TransactionDirection = 'credit' | 'debit';

export type TransactionCategory =
  | 'personal_income'
  | 'business_income'
  | 'personal_expense'
  | 'business_expense'
  | 'unverified_income';

export type TransactionSource = 'webhook' | 'manual';

export interface Transaction {
  id: string;
  amount: number;
  direction: TransactionDirection;
  category: TransactionCategory;
  rawSender: string;
  notes: string;
  source: TransactionSource;
  timestamp: Date;
  createdAt: Date;
  reviewedAt?: Date;
}

// ─── Fixed Deposit Types ─────────────────────────────────────────────

export type FDStatus = 'active' | 'matured';

export interface FixedDeposit {
  id: string;
  bankName: string;
  principal: number;
  interestRate: number;
  startDate: Date;
  maturityDate: Date;
  maturityAmount?: number; // actual bank-confirmed value (overrides calculated)
  status: FDStatus;
  notes: string;
  createdAt: Date;
}

export type FDTransactionType = 'deposit' | 'withdrawal' | 'interest';

export interface FDTransaction {
  id: string;
  fdId: string;
  type: FDTransactionType;
  amount: number;
  timestamp: Date;
  notes: string;
  createdAt: Date;
}

// ─── Currency Formatting ─────────────────────────────────────────────

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return inrFormatter.format(amount);
}

// ─── Category Labels & Colors ────────────────────────────────────────

export const CATEGORY_CONFIG: Record<
  TransactionCategory,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  personal_income: {
    label: 'Personal Income',
    color: '#0d9488',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
  },
  business_income: {
    label: 'Business Income',
    color: '#d97706',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  personal_expense: {
    label: 'Personal Expense',
    color: '#0f766e',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
  },
  business_expense: {
    label: 'Business Expense',
    color: '#b45309',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
  },
  unverified_income: {
    label: 'Unverified',
    color: '#ea580c',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
};

// ─── Firestore Collection Names ──────────────────────────────────────

export const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  FIXED_DEPOSITS: 'fixedDeposits',
  FD_TRANSACTIONS: 'fdTransactions',
} as const;
