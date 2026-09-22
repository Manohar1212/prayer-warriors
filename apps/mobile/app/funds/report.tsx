import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';

import { formatRupees, monthlyReport, reportCsv, useFunds } from '@/features/funds';
import { useMembers } from '@/features/members';
import { useLanguage, type TranslationKey } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Card, Screen, Text } from '@/ui';


function Line({ label, amountPaise, strong = false, negative = false }: { label: string; amountPaise: number; strong?: boolean; negative?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text variant={strong ? 'label' : 'body'} className="flex-1 text-[15px]">
        {label}
      </Text>
      {/* Nothing spent is ₹0, not a red −₹0. */}
      <Text variant="label" color={negative && amountPaise ? 'roseDeep' : strong ? 'primary' : 'ink'} className="text-[15px]">
        {negative && amountPaise ? '−' : ''}
        {formatRupees(amountPaise)}
      </Text>
    </View>
  );
}

export default function ReportScreen() {
  const { t, locale } = useLanguage();
  const { contributions, monthlyCollected, expenses } = useFunds();
  const { isAdmin } = useMembers();
  // Who gave what is for admins; a member sees the month's total only, not even a list of their own.
  const named = useMemo(() => (isAdmin ? contributions : []), [isAdmin, contributions]);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState<string | null>(null);

  const report = useMemo(() => monthlyReport(named, monthlyCollected, expenses, year, month), [named, monthlyCollected, expenses, year, month]);
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  function shift(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  async function exportCsv() {
    setStatus(null);
    const csv = reportCsv(report, named, expenses);
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
        setStatus(t('funds.report.savedTo', { path: file.uri }));
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t('funds.report.exportFailed'));
    }
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <View className="flex-row items-center justify-between">
        <Pressable accessibilityRole="button" accessibilityLabel={t('funds.report.previousMonth')} onPress={() => shift(-1)} hitSlop={8} className="p-2">
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text variant="title">
          {new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('funds.report.nextMonth')} onPress={() => shift(1)} hitSlop={8} disabled={isCurrent} className="p-2">
          <Ionicons name="chevron-forward" size={22} color={isCurrent ? colors.border : colors.primary} />
        </Pressable>
      </View>

      <Card className="gap-1">
        <Line label={t('funds.report.opening')} amountPaise={report.openingPaise} strong />
      </Card>

      <Card className="gap-1">
        <Text variant="title" className="mb-1">
          {t('funds.report.contributions')}
        </Text>
        {isAdmin ? (
          <>
            {report.contributions.length ? report.contributions.map((l) => <Line key={l.label} label={l.label} amountPaise={l.amountPaise} />) : <Text variant="muted">{t('funds.report.none')}</Text>}
            <View className="my-1 h-px bg-border" />
          </>
        ) : null}
        <Line label={t('funds.report.totalCollected')} amountPaise={report.collectedPaise} strong />
      </Card>

      <Card className="gap-1">
        <Text variant="title" className="mb-1">
          {t('funds.report.expenses')}
        </Text>
        {report.expenses.length ? report.expenses.map((l) => <Line key={l.label} label={l.labelKey ? t(l.labelKey as TranslationKey) : l.label} amountPaise={l.amountPaise} negative />) : <Text variant="muted">{t('funds.report.none')}</Text>}
        <View className="my-1 h-px bg-border" />
        <Line label={t('funds.report.totalSpent')} amountPaise={report.spentPaise} strong negative />
      </Card>

      <Card tone="honey" className="gap-1">
        <Line label={t('funds.report.closing')} amountPaise={report.closingPaise} strong />
      </Card>

      <Button title={t('funds.report.export')} variant="secondary" onPress={exportCsv} />
      {status ? <Text variant="muted">{status}</Text> : null}
    </Screen>
  );
}
