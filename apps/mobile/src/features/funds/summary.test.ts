import { monthlyReport, summarise, toCsv, toTransactions } from './summary';
import type { Contribution, Expense } from './types';

const c = (o: Partial<Contribution>): Contribution => ({
  id: 'c', memberId: 'u1', memberName: 'Sarah', amountPaise: 500000, transactionDate: '2026-09-05T00:00:00.000Z',
  paymentMethod: 'cash', reference: '', note: '', createdAt: '2026-09-05T00:00:00.000Z', ...o,
});
const e = (o: Partial<Expense>): Expense => ({
  id: 'e', category: 'hall', amountPaise: 350000, paidTo: 'Hall', description: '', transactionDate: '2026-09-06T00:00:00.000Z',
  createdAt: '2026-09-06T00:00:00.000Z', ...o,
});

const contributions = [
  c({ id: 'c1', transactionDate: '2026-08-20T00:00:00.000Z', amountPaise: 3200000 }),
  c({ id: 'c2', memberId: 'u2', memberName: 'Mary', amountPaise: 300000 }),
  c({ id: 'c3', amountPaise: 500000 }),
];
const expenses = [
  e({ id: 'e1', transactionDate: '2026-08-25T00:00:00.000Z', amountPaise: 1000000, category: 'event' }),
  e({ id: 'e2', amountPaise: 350000 }),
  e({ id: 'e3', category: 'food', paidTo: 'Caterer', amountPaise: 200000, transactionDate: '2026-09-07T00:00:00.000Z' }),
];

describe('summarise', () => {
  it('computes all-time balance', () => {
    expect(summarise(contributions, expenses)).toEqual({ collectedPaise: 4000000, spentPaise: 1550000, netPaise: 2450000 });
  });
  it('computes a date range', () => {
    const sept = { from: '2026-09-01', to: '2026-09-30' };
    expect(summarise(contributions, expenses, sept)).toEqual({ collectedPaise: 800000, spentPaise: 550000, netPaise: 250000 });
  });
});

describe('monthlyReport', () => {
  it('builds opening, grouped lines, and closing', () => {
    const report = monthlyReport(contributions, expenses, 2026, 9);
    expect(report.openingPaise).toBe(2200000);
    expect(report.contributions).toEqual([
      { label: 'Sarah', amountPaise: 500000 },
      { label: 'Mary', amountPaise: 300000 },
    ]);
    expect(report.expenses).toEqual([
      { label: 'Hall', amountPaise: 350000 },
      { label: 'Food', amountPaise: 200000 },
    ]);
    expect(report.collectedPaise).toBe(800000);
    expect(report.spentPaise).toBe(550000);
    expect(report.closingPaise).toBe(2450000);
  });
});

describe('toTransactions', () => {
  it('merges newest first with signed amounts', () => {
    const tx = toTransactions(contributions, expenses);
    expect(tx.map((t) => t.id)).toEqual(['e3', 'e2', 'c2', 'c3', 'e1', 'c1']);
    expect(tx[0]).toMatchObject({ kind: 'expense', signedPaise: -200000, title: 'Caterer', subtitle: 'Food' });
    expect(tx[2]).toMatchObject({ kind: 'contribution', signedPaise: 300000, title: 'Mary', subtitle: 'Cash' });
  });
});

describe('toCsv', () => {
  it('escapes commas and quotes', () => {
    const csv = toCsv([['Date', 'Type', 'Who', 'Amount'], ['2026-09-05', 'Contribution', 'O\'Brien, Sarah', '5000.00'], ['2026-09-06', 'Expense', 'Hall "A"', '-3500.00']]);
    expect(csv).toBe('Date,Type,Who,Amount\n2026-09-05,Contribution,"O\'Brien, Sarah",5000.00\n2026-09-06,Expense,"Hall ""A""",-3500.00');
  });
});
