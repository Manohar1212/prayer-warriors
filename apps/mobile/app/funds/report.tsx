import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';

import { formatRupees, monthlyReport, reportCsv, useFunds } from '@/features/funds';
import { colors } from '@/theme/tokens';
import { Button, Card, Screen, Text } from '@/ui';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function Line({ label, amountPaise, strong = false, negative = false }: { label: string; amountPaise: number; strong?: boolean; negative?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text variant={strong ? 'label' : 'body'} className="flex-1 text-[15px]">
        {label}
      </Text>
      <Text variant="label" color={negative ? 'roseDeep' : strong ? 'primary' : 'ink'} className="text-[15px]">
        {negative ? '−' : ''}
        {formatRupees(amountPaise)}
      </Text>
    </View>
  );
}

export default function ReportScreen() {
  const { contributions, expenses } = useFunds();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState<string | null>(null);

  const report = useMemo(() => monthlyReport(contributions, expenses, year, month), [contributions, expenses, year, month]);
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  function shift(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  async function exportCsv() {
    setStatus(null);
    const csv = reportCsv(report, contributions, expenses);
    const name = `prayer-warriors-${year}-${String(month).padStart(2, '0')}.csv`;
    try {
      if (Platform.OS === 'web') {
        await Share.share({ message: csv, title: name });
        return;
      }
      const file = new File(Paths.cache, name);
      file.write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: name });
      } else {
        setStatus(`Saved to ${file.uri}`);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not export.');
    }
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <View className="flex-row items-center justify-between">
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shift(-1)} hitSlop={8} className="p-2">
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text variant="title">
          {MONTHS[month - 1]} {year}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => shift(1)} hitSlop={8} disabled={isCurrent} className="p-2">
          <Ionicons name="chevron-forward" size={22} color={isCurrent ? colors.border : colors.primary} />
        </Pressable>
      </View>

      <Card className="gap-1">
        <Line label="Opening balance" amountPaise={report.openingPaise} strong />
      </Card>

      <Card className="gap-1">
        <Text variant="title" className="mb-1">
          Contributions
        </Text>
        {report.contributions.length ? report.contributions.map((l) => <Line key={l.label} label={l.label} amountPaise={l.amountPaise} />) : <Text variant="muted">None this month.</Text>}
        <View className="my-1 h-px bg-border" />
        <Line label="Total collected" amountPaise={report.collectedPaise} strong />
      </Card>

      <Card className="gap-1">
        <Text variant="title" className="mb-1">
          Expenses
        </Text>
        {report.expenses.length ? report.expenses.map((l) => <Line key={l.label} label={l.label} amountPaise={l.amountPaise} negative />) : <Text variant="muted">None this month.</Text>}
        <View className="my-1 h-px bg-border" />
        <Line label="Total spent" amountPaise={report.spentPaise} strong negative />
      </Card>

      <Card tone="honey" className="gap-1">
        <Line label="Closing balance" amountPaise={report.closingPaise} strong />
      </Card>

      <Button title="Export CSV" variant="secondary" onPress={exportCsv} />
      {status ? <Text variant="muted">{status}</Text> : null}
    </Screen>
  );
}
