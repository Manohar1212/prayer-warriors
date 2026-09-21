export type PaymentMethod = 'cash' | 'bank' | 'other';
export type ExpenseCategory = 'hall' | 'food' | 'transport' | 'charity' | 'event' | 'supplies' | 'other';

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'bank', label: 'Bank transfer' },
  { id: 'other', label: 'Other' },
];

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'hall', label: 'Hall' },
  { id: 'food', label: 'Food' },
  { id: 'transport', label: 'Transport' },
  { id: 'charity', label: 'Charity' },
  { id: 'event', label: 'Event' },
  { id: 'supplies', label: 'Supplies' },
  { id: 'other', label: 'Other' },
];

export function methodLabel(id: string): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? 'Other';
}

export function categoryLabel(id: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? 'Other';
}

export type Contribution = {
  id: string;
  memberId: string;
  memberName: string;
  amountPaise: number;
  transactionDate: string;
  paymentMethod: PaymentMethod;
  reference: string;
  note: string;
  createdAt: string;
};

export type Expense = {
  id: string;
  category: ExpenseCategory;
  amountPaise: number;
  paidTo: string;
  description: string;
  transactionDate: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  kind: 'contribution' | 'expense';
  title: string;
  subtitle: string;
  signedPaise: number;
  date: string;
};

export type NewContribution = {
  memberId: string;
  amountPaise: number;
  transactionDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  reference: string;
  note: string;
};

export type NewExpense = {
  category: ExpenseCategory;
  amountPaise: number;
  paidTo: string;
  description: string;
  transactionDate: string; // YYYY-MM-DD
};

export type AuditEntry = {
  id: string;
  actor: string;
  entityType: 'contribution' | 'expense';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  reason: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
};

/** What a month brought in, from the server. Everyone gets these; only admins get the names behind them. */
export type MonthTotal = { month: string; collectedPaise: number }; // month: YYYY-MM

export type Ledger = {
  /** All of them for an admin; a member only receives their own. */
  contributions: Contribution[];
  expenses: Expense[];
  monthlyCollected: MonthTotal[];
};

export type RawContribution = {
  id: string;
  member: { id: string; displayName?: string } | null;
  amountPaise: number;
  transactionDate: string;
  paymentMethod: string;
  reference: string;
  note: string;
  createdAt: string;
};

export type RawExpense = {
  id: string;
  category: string;
  amountPaise: number;
  paidTo: string;
  description: string;
  transactionDate: string;
  createdAt: string;
};

export type RawAuditEntry = {
  id: string;
  user: { id: string; displayName?: string } | null;
  entityType: string;
  entityId: string;
  action: string;
  reason?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  createdAt: string;
};

export type FundsService = {
  list(): Promise<Ledger>;
  addContribution(input: NewContribution): Promise<void>;
  updateContribution(id: string, patch: Partial<NewContribution>, reason: string): Promise<void>;
  deleteContribution(id: string, reason: string): Promise<void>;
  addExpense(input: NewExpense): Promise<void>;
  updateExpense(id: string, patch: Partial<NewExpense>, reason: string): Promise<void>;
  deleteExpense(id: string, reason: string): Promise<void>;
  auditLog(): Promise<AuditEntry[]>;
};
