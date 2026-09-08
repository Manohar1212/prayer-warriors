import { categoryLabel, methodLabel, type Contribution, type Expense, type Transaction } from './types';

export type DateRange = { from: string; to: string }; // YYYY-MM-DD inclusive

export type Summary = { collectedPaise: number; spentPaise: number; netPaise: number };

export type ReportLine = { label: string; amountPaise: number };

export type MonthlyReport = Summary & {
  year: number;
  month: number; // 1-12
  openingPaise: number;
  closingPaise: number;
  contributions: ReportLine[];
  expenses: ReportLine[];
};

function day(iso: string): string {
  return iso.slice(0, 10);
}

function inRange(iso: string, range?: DateRange): boolean {
  if (!range) return true;
  const d = day(iso);
  return d >= range.from && d <= range.to;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export function summarise(contributions: Contribution[], expenses: Expense[], range?: DateRange): Summary {
  const collectedPaise = sum(contributions.filter((c) => inRange(c.transactionDate, range)).map((c) => c.amountPaise));
  const spentPaise = sum(expenses.filter((e) => inRange(e.transactionDate, range)).map((e) => e.amountPaise));
  return { collectedPaise, spentPaise, netPaise: collectedPaise - spentPaise };
}

function groupBy<T>(items: T[], key: (t: T) => string, amount: (t: T) => number): ReportLine[] {
  const totals = new Map<string, number>();
  items.forEach((item) => totals.set(key(item), (totals.get(key(item)) ?? 0) + amount(item)));
  return [...totals.entries()]
    .map(([label, amountPaise]) => ({ label, amountPaise }))
    .sort((a, b) => b.amountPaise - a.amountPaise || a.label.localeCompare(b.label));
}

export function monthRange(year: number, month: number): DateRange {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}` };
}

export function monthlyReport(contributions: Contribution[], expenses: Expense[], year: number, month: number): MonthlyReport {
  const range = monthRange(year, month);
  const before: DateRange = { from: '0000-01-01', to: `${range.from.slice(0, 8)}00` };
  const opening = summarise(contributions, expenses, before).netPaise;
  const inMonthC = contributions.filter((c) => inRange(c.transactionDate, range));
  const inMonthE = expenses.filter((e) => inRange(e.transactionDate, range));
  const summary = summarise(inMonthC, inMonthE);
  return {
    year,
    month,
    ...summary,
    openingPaise: opening,
    closingPaise: opening + summary.netPaise,
    contributions: groupBy(inMonthC, (c) => c.memberName, (c) => c.amountPaise),
    expenses: groupBy(inMonthE, (e) => categoryLabel(e.category), (e) => e.amountPaise),
  };
}

export function toTransactions(contributions: Contribution[], expenses: Expense[]): Transaction[] {
  const rows: Transaction[] = [
    ...contributions.map((c) => ({
      id: c.id,
      kind: 'contribution' as const,
      title: c.memberName,
      subtitle: methodLabel(c.paymentMethod),
      signedPaise: c.amountPaise,
      date: c.transactionDate,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      kind: 'expense' as const,
      title: e.paidTo,
      subtitle: categoryLabel(e.category),
      signedPaise: -e.amountPaise,
      date: e.transactionDate,
    })),
  ];
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

export function reportCsv(report: MonthlyReport, contributions: Contribution[], expenses: Expense[]): string {
  const range = monthRange(report.year, report.month);
  const rupees = (paise: number) => (paise / 100).toFixed(2);
  const rows: string[][] = [['Date', 'Type', 'Who / Payee', 'Detail', 'Amount (INR)']];
  contributions
    .filter((c) => inRange(c.transactionDate, range))
    .forEach((c) => rows.push([day(c.transactionDate), 'Contribution', c.memberName, [methodLabel(c.paymentMethod), c.reference].filter(Boolean).join(' - '), rupees(c.amountPaise)]));
  expenses
    .filter((e) => inRange(e.transactionDate, range))
    .forEach((e) => rows.push([day(e.transactionDate), 'Expense', e.paidTo, [categoryLabel(e.category), e.description].filter(Boolean).join(' - '), rupees(-e.amountPaise)]));
  rows.push([], ['Opening balance', '', '', '', rupees(report.openingPaise)]);
  rows.push(['Total contributions', '', '', '', rupees(report.collectedPaise)]);
  rows.push(['Total expenses', '', '', '', rupees(-report.spentPaise)]);
  rows.push(['Closing balance', '', '', '', rupees(report.closingPaise)]);
  return toCsv(rows);
}
