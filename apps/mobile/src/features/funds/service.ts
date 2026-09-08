import { mapParseError } from '../auth/errors';
import type {
  AuditEntry,
  Contribution,
  Expense,
  ExpenseCategory,
  FundsService,
  NewContribution,
  NewExpense,
  PaymentMethod,
  RawAuditEntry,
  RawContribution,
  RawExpense,
} from './types';

type Deps = {
  fetchContributions: () => Promise<RawContribution[]>;
  fetchExpenses: () => Promise<RawExpense[]>;
  fetchAudit: () => Promise<RawAuditEntry[]>;
  cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> };
};

function toContribution(row: RawContribution): Contribution {
  return {
    id: row.id,
    memberId: row.member?.id ?? '',
    memberName: row.member?.displayName?.trim() || 'Member',
    amountPaise: row.amountPaise,
    transactionDate: row.transactionDate,
    paymentMethod: (row.paymentMethod as PaymentMethod) || 'other',
    reference: row.reference ?? '',
    note: row.note ?? '',
    createdAt: row.createdAt,
  };
}

function toExpense(row: RawExpense): Expense {
  return {
    id: row.id,
    category: (row.category as ExpenseCategory) || 'other',
    amountPaise: row.amountPaise,
    paidTo: row.paidTo,
    description: row.description ?? '',
    transactionDate: row.transactionDate,
    createdAt: row.createdAt,
  };
}

function toAudit(row: RawAuditEntry): AuditEntry {
  return {
    id: row.id,
    actor: row.user?.displayName?.trim() || 'Admin',
    entityType: row.entityType === 'expense' ? 'expense' : 'contribution',
    entityId: row.entityId,
    action: row.action === 'update' ? 'update' : row.action === 'delete' ? 'delete' : 'create',
    reason: row.reason ?? null,
    oldValues: row.oldValues ?? null,
    newValues: row.newValues ?? null,
    createdAt: row.createdAt,
  };
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createFundsService(deps: Deps): FundsService {
  const run = (name: string, params: Record<string, unknown>) =>
    guarded(async () => {
      await deps.cloud.run(name, params);
    });

  return {
    list: () =>
      guarded(async () => {
        const [c, e] = await Promise.all([deps.fetchContributions(), deps.fetchExpenses()]);
        return { contributions: c.map(toContribution), expenses: e.map(toExpense) };
      }),
    addContribution: (input: NewContribution) => run('addContribution', { ...input }),
    updateContribution: (id, patch, reason) => run('updateContribution', { contributionId: id, ...patch, reason }),
    deleteContribution: (id, reason) => run('deleteContribution', { contributionId: id, reason }),
    addExpense: (input: NewExpense) => run('addExpense', { ...input }),
    updateExpense: (id, patch, reason) => run('updateExpense', { expenseId: id, ...patch, reason }),
    deleteExpense: (id, reason) => run('deleteExpense', { expenseId: id, reason }),
    auditLog: () => guarded(async () => (await deps.fetchAudit()).map(toAudit)),
  };
}
