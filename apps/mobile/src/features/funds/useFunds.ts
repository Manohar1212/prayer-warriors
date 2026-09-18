import { useMemo } from 'react';

import { fundsService } from '../../lib/parse';
import { useCachedQuery } from '../../lib/useCachedQuery';
import { monthRange, summarise, toTransactions, type Summary } from './summary';
import type { Contribution, Expense, Ledger, Transaction } from './types';

export type FundsState = {
  contributions: Contribution[];
  expenses: Expense[];
  transactions: Transaction[];
  balancePaise: number;
  thisMonth: Summary;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useFunds(): FundsState {
  const { data, loading, error, refresh } = useCachedQuery<Ledger>('funds', () => fundsService.list(), { fallback: 'Could not load the ledger.' });
  const ledger = useMemo<Ledger>(() => data ?? { contributions: [], expenses: [] }, [data]);

  const derived = useMemo(() => {
    const now = new Date();
    return {
      transactions: toTransactions(ledger.contributions, ledger.expenses),
      balancePaise: summarise(ledger.contributions, ledger.expenses).netPaise,
      thisMonth: summarise(ledger.contributions, ledger.expenses, monthRange(now.getFullYear(), now.getMonth() + 1)),
    };
  }, [ledger]);

  return { ...ledger, ...derived, loading, error, refresh };
}
