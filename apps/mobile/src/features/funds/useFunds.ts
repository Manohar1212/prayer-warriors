import { useMemo } from 'react';

import { useT } from '../../i18n';
import { fundsService } from '../../lib/parse';
import { useAuth } from '../auth';
import { useCachedQuery } from '../../lib/useCachedQuery';
import { monthRange, summarise, toTransactions, type Summary } from './summary';
import type { Contribution, Expense, Ledger, MonthTotal, Transaction } from './types';

export type FundsState = {
  contributions: Contribution[];
  expenses: Expense[];
  monthlyCollected: MonthTotal[];
  transactions: Transaction[];
  balancePaise: number;
  thisMonth: Summary;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useFunds(): FundsState {
  const { data, loading, error, refresh } = useCachedQuery<Ledger>('funds', () => fundsService.list(), { fallback: 'Could not load the ledger.' });
  const { user } = useAuth();
  const t = useT();
  // A ledger cached by an older build has no monthly totals yet.
  const ledger = useMemo<Ledger>(() => ({ contributions: [], expenses: [], ...data, monthlyCollected: data?.monthlyCollected ?? [] }), [data]);
  const youLabel = t('funds.you');

  const derived = useMemo(() => {
    const now = new Date();
    return {
      transactions: toTransactions(ledger.contributions, ledger.expenses, user ? { id: user.id, label: youLabel } : undefined),
      balancePaise: summarise(ledger.monthlyCollected, ledger.expenses).netPaise,
      thisMonth: summarise(ledger.monthlyCollected, ledger.expenses, monthRange(now.getFullYear(), now.getMonth() + 1)),
    };
  }, [ledger, user, youLabel]);

  return { ...ledger, ...derived, loading, error, refresh };
}
