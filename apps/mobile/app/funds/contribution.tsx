import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { formatRupees, methodLabel, PAYMENT_METHODS, parseRupees, useFunds, type PaymentMethod } from '@/features/funds';
import { isIsoDate, longDate, todayIso } from '@/features/funds/dates';
import { useMembers } from '@/features/members';
import { goBackOr } from '@/lib/navigation';
import { fundsService } from '@/lib/parse';
import { Button, Card, Chip, Input, Screen, Text } from '@/ui';

export default function ContributionScreen() {
  const router = useRouter();
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
      <Screen scroll backdrop className="gap-6 pt-6">
        <Text variant="display" color="primary">
          {formatRupees(existing.amountPaise)}
        </Text>
        <Card className="gap-3">
          <Text variant="muted">Contribution from</Text>
          <Text variant="title">{existing.memberName}</Text>
          <Text variant="muted">
            {methodLabel(existing.paymentMethod)} on {longDate(existing.transactionDate)}
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
      setError(err instanceof Error ? err.message : 'Could not save.');
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
      setError(err instanceof Error ? err.message : 'Could not delete.');
      setBusy(false);
    }
  }

  if (id && !existing && loading) {
    return (
      <Screen backdrop className="justify-center">
        <Text variant="muted">Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll backdrop className="gap-6 pt-6">
      <View className="gap-2">
        <Text variant="label">Member</Text>
        <View className="flex-row flex-wrap gap-2">
          {members.map((m) => (
            <Chip key={m.userId} label={m.displayName} selected={memberId === m.userId} onPress={() => setMemberId(m.userId)} />
          ))}
        </View>
      </View>
      <Input label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="5000" error={amount && !amountPaise ? 'Enter an amount greater than zero.' : null} />
      <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" error={date && !dateOk ? 'Enter a valid date.' : null} />
      <View className="gap-2">
        <Text variant="label">Payment method</Text>
        <View className="flex-row flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <Chip key={m.id} label={m.label} selected={method === m.id} onPress={() => setMethod(m.id)} />
          ))}
        </View>
      </View>
      <Input label="Reference (optional)" value={reference} onChangeText={setReference} maxLength={120} placeholder="September contribution" />
      <Input label="Note (optional)" value={note} onChangeText={setNote} maxLength={500} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
      {existing ? <Input label="Reason for this change" value={reason} onChangeText={setReason} maxLength={200} /> : null}
      {error ? (
        <Text variant="muted" color="rose">
          {error}
        </Text>
      ) : null}
      <Button title={existing ? 'Save changes' : 'Record contribution'} onPress={submit} loading={busy && !deleting} disabled={!canSubmit} />
      {existing ? (
        deleting ? (
          <View className="gap-2">
            <Text variant="muted">Delete this contribution? The change is kept in the history.</Text>
            <Button title="Delete" variant="secondary" onPress={destroy} loading={busy} disabled={!reason.trim()} />
            <Button title="Keep it" variant="ghost" onPress={() => setDeleting(false)} />
          </View>
        ) : (
          <Button title="Delete" variant="ghost" onPress={() => setDeleting(true)} className="self-start px-0" />
        )
      ) : null}
    </Screen>
  );
}
