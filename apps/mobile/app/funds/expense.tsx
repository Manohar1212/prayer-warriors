import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { EXPENSE_CATEGORIES, formatRupees, parseRupees, useFunds, type ExpenseCategory } from '@/features/funds';
import { isIsoDate, longDate, todayIso } from '@/features/funds/dates';
import { useMembers } from '@/features/members';
import { useLanguage, type TranslationKey } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { fundsService } from '@/lib/parse';
import { fonts } from '@/theme/tokens';
import { Button, Card, Chip, Input, Screen, Text } from '@/ui';

export default function ExpenseScreen() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { isAdmin } = useMembers();
  const { expenses, loading } = useFunds();
  const existing = id ? expenses.find((e) => e.id === id) ?? null : null;

  const [category, setCategory] = useState<ExpenseCategory>('hall');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayIso());
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !existing) return;
    setCategory(existing.category);
    setAmount(String(existing.amountPaise / 100));
    setPaidTo(existing.paidTo);
    setDescription(existing.description);
    setDate(existing.transactionDate.slice(0, 10));
    setLoaded(true);
  }, [existing, loaded]);

  const amountPaise = parseRupees(amount);
  const dateOk = isIsoDate(date);
  const canSubmit = Boolean(amountPaise && paidTo.trim() && dateOk && (!existing || reason.trim()));

  if (!isAdmin && existing) {
    return (
      <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
        <Text color="roseDeep" style={{ fontFamily: fonts.numeric, fontSize: 26, lineHeight: 32 }}>
          −{formatRupees(existing.amountPaise)}
        </Text>
        <Card className="gap-3">
          <Text variant="muted">{t('funds.expense.paidTo')}</Text>
          <Text variant="title">{existing.paidTo}</Text>
          <Text variant="muted">
            {t('funds.expense.onDate', { category: t(`funds.category.${existing.category}` as TranslationKey), date: longDate(existing.transactionDate, locale) })}
          </Text>
          {existing.description ? <Text>{existing.description}</Text> : null}
        </Card>
      </Screen>
    );
  }

  async function submit() {
    if (!canSubmit || !amountPaise) return;
    setBusy(true);
    setError(null);
    try {
      if (existing) {
        await fundsService.updateExpense(existing.id, { category, amountPaise, paidTo, description, transactionDate: date }, reason);
      } else {
        await fundsService.addExpense({ category, amountPaise, paidTo, description, transactionDate: date });
      }
      goBackOr(router, '/(tabs)/funds');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('funds.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (!existing || !reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await fundsService.deleteExpense(existing.id, reason);
      goBackOr(router, '/(tabs)/funds');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('funds.deleteFailed'));
      setBusy(false);
    }
  }

  if (id && !existing && loading) {
    return (
      <Screen edges={['bottom']} backdrop className="justify-center">
        <Text variant="muted">{t('common.loading')}</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <View className="gap-2">
        <Text variant="label">{t('common.category')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map((c) => (
            <Chip key={c.id} label={t(`funds.category.${c.id}` as TranslationKey)} selected={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </View>
      </View>
      <Input label={t('common.amount')} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="3500" error={amount && !amountPaise ? t('common.invalidAmount') : null} />
      <Input label={t('funds.expense.paidTo')} value={paidTo} onChangeText={setPaidTo} maxLength={120} placeholder={t('funds.expense.paidToPlaceholder')} />
      <Input label={t('funds.expense.description')} value={description} onChangeText={setDescription} maxLength={500} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
      <Input label={t('common.date')} value={date} onChangeText={setDate} autoCapitalize="none" error={date && !dateOk ? t('common.invalidDate') : null} />
      {existing ? <Input label={t('common.reasonForChange')} value={reason} onChangeText={setReason} maxLength={200} /> : null}
      {error ? (
        <Text variant="muted" color="rose">
          {error}
        </Text>
      ) : null}
      <Button title={existing ? t('common.saveChanges') : t('funds.recordExpense')} onPress={submit} loading={busy && !deleting} disabled={!canSubmit} />
      {existing ? (
        deleting ? (
          <View className="gap-2">
            <Text variant="muted">{t('funds.expense.deleteConfirm')}</Text>
            <Button title={t('common.delete')} variant="secondary" onPress={destroy} loading={busy} disabled={!reason.trim()} />
            <Button title={t('common.keepIt')} variant="ghost" onPress={() => setDeleting(false)} />
          </View>
        ) : (
          <Button title={t('common.delete')} variant="ghost" onPress={() => setDeleting(true)} className="self-start px-0" />
        )
      ) : null}
    </Screen>
  );
}
