import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { formatRupees, methodLabel, PAYMENT_METHODS, parseRupees, useFunds, type PaymentMethod } from '@/features/funds';
import { isIsoDate, longDate, todayIso } from '@/features/funds/dates';
import { useMembers } from '@/features/members';
import { useLanguage, type TranslationKey } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { fundsService } from '@/lib/parse';
import { fonts } from '@/theme/tokens';
import { Button, Card, Chip, Input, Screen, Text } from '@/ui';

export default function ContributionScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { members, isAdmin } = useMembers();
  const { contributions, loading } = useFunds();
  const existing = id ? contributions.find((c) => c.id === id) ?? null : null;

  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !existing) return;
    setMemberId(existing.memberId);
    setAmount(String(existing.amountPaise / 100));
    setDate(existing.transactionDate.slice(0, 10));
    setMethod(existing.paymentMethod);
    setReference(existing.reference);
    setNote(existing.note);
    setLoaded(true);
  }, [existing, loaded]);

  const amountPaise = parseRupees(amount);
  const dateOk = isIsoDate(date);
  const canSubmit = Boolean(memberId && amountPaise && dateOk && (!existing || reason.trim()));

  if (!isAdmin && existing) {
    return (
      <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
        <Text color="primary" style={{ fontFamily: fonts.numeric, fontSize: 26, lineHeight: 32 }}>
          {formatRupees(existing.amountPaise)}
        </Text>
        <Card className="gap-3">
          <Text variant="muted">{t('funds.contribution.from')}</Text>
          <Text variant="title">{existing.memberName}</Text>
          <Text variant="muted">
            {t(`funds.method.${existing.paymentMethod}` as TranslationKey)} · {new Date(existing.transactionDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          {existing.reference ? <Text>{existing.reference}</Text> : null}
          {existing.note ? <Text variant="muted">{existing.note}</Text> : null}
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
        await fundsService.updateContribution(existing.id, { memberId, amountPaise, transactionDate: date, paymentMethod: method, reference, note }, reason);
      } else {
        await fundsService.addContribution({ memberId, amountPaise, transactionDate: date, paymentMethod: method, reference, note });
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
      await fundsService.deleteContribution(existing.id, reason);
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
        <Text variant="label">{t('funds.contribution.member')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {members.map((m) => (
            <Chip key={m.userId} label={m.displayName} selected={memberId === m.userId} onPress={() => setMemberId(m.userId)} />
          ))}
        </View>
      </View>
      <Input label={t('common.amount')} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="5000" error={amount && !amountPaise ? t('common.invalidAmount') : null} />
      <Input label={t('common.date')} value={date} onChangeText={setDate} autoCapitalize="none" error={date && !dateOk ? t('common.invalidDate') : null} />
      <View className="gap-2">
        <Text variant="label">{t('funds.contribution.method')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <Chip key={m.id} label={t(`funds.method.${m.id}` as TranslationKey)} selected={method === m.id} onPress={() => setMethod(m.id)} />
          ))}
        </View>
      </View>
      <Input label={t('funds.contribution.reference')} value={reference} onChangeText={setReference} maxLength={120} placeholder="September contribution" />
      <Input label={t('funds.contribution.note')} value={note} onChangeText={setNote} maxLength={500} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
      {existing ? <Input label={t('common.reasonForChange')} value={reason} onChangeText={setReason} maxLength={200} /> : null}
      {error ? (
        <Text variant="muted" color="rose">
          {error}
        </Text>
      ) : null}
      <Button title={existing ? t('common.saveChanges') : t('funds.recordContribution')} onPress={submit} loading={busy && !deleting} disabled={!canSubmit} />
      {existing ? (
        deleting ? (
          <View className="gap-2">
            <Text variant="muted">{t('funds.contribution.deleteConfirm')}</Text>
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
