import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fundsService } from '../../lib/parse';
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
  const [ledger, setLedger] = useState<Ledger>({ contributions: [], expenses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLedger(await fundsService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the ledger.');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const derived = useMemo(() => {
    const now = new Date();
    return {
      transactions: toTransactions(ledger.contributions, ledger.expenses),
      balancePaise: summarise(ledger.contributions, ledger.expenses).netPaise,
      thisMonth: summarise(ledger.contributions, ledger.expenses, monthRange(now.getFullYear(), now.getMonth() + 1)),
    };
  }, [ledger]);

  return { ...ledger, ...derived, loading, error, refresh: load };
}
