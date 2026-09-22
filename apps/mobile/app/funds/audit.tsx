import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { formatRupees, type AuditEntry } from '@/features/funds';
import { fundsService } from '@/lib/parse';
import { useLanguage, type TranslationKey } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Badge, Card, Screen, Text } from '@/ui';

function when(iso: string, locale: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** "Recorded expense ₹3,500 to Hall", in the app language. */
function describe(entry: AuditEntry, t: T): string {
  const values = entry.action === 'delete' ? entry.oldValues : entry.newValues;
  const amount = typeof values?.amountPaise === 'number' ? formatRupees(values.amountPaise) : '';
  const who = typeof values?.paidTo === 'string' ? values.paidTo : '';
  const line = t(`funds.audit.line.${entry.entityType === 'expense' ? 'expense' : 'contribution'}.${entry.action}` as TranslationKey, { amount });
  return who ? `${line} · ${who}` : line;
}

/** Field names people recognise, instead of the stored ones like amountPaise. */
const FIELD_LABEL: Record<string, TranslationKey> = {
  amountPaise: 'common.amount',
  transactionDate: 'common.date',
  paymentMethod: 'funds.contribution.method',
  reference: 'funds.contribution.reference',
  note: 'funds.contribution.note',
  category: 'common.category',
  paidTo: 'funds.expense.paidTo',
  description: 'funds.expense.description',
  memberId: 'common.member',
};

function changedFields(entry: AuditEntry, t: T): string[] {
  if (entry.action !== 'update' || !entry.oldValues || !entry.newValues) return [];
  return Object.keys(entry.newValues)
    .filter((k) => JSON.stringify(entry.oldValues?.[k]) !== JSON.stringify(entry.newValues?.[k]))
    .map((k) => {
      const a = entry.oldValues?.[k];
      const b = entry.newValues?.[k];
      const fmt = (v: unknown) => (k === 'amountPaise' && typeof v === 'number' ? formatRupees(v) : String(v ?? '—').slice(0, 40));
      return `${FIELD_LABEL[k] ? t(FIELD_LABEL[k]) : k}: ${fmt(a)} → ${fmt(b)}`;
    });
}

export default function AuditScreen() {
  const { t, locale } = useLanguage();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fundsService
      .auditLog()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : t('funds.audit.loadFailed')));
  }, []);

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-4 pt-6">
      <Text variant="muted" className="text-[15px] leading-[22px]">
        {t('funds.audit.intro')}
      </Text>
      {error ? (
        <Text variant="muted" color="rose">
          {error}
        </Text>
      ) : null}
      {entries === null ? (
        <ActivityIndicator color={colors.primary} className="mt-6" />
      ) : entries.length === 0 ? (
        <Text variant="muted">{t('funds.audit.empty')}</Text>
      ) : (
        entries.map((entry) => (
          <Card key={entry.id} className="gap-2">
            <View className="flex-row items-center justify-between">
              <Badge label={t(`funds.audit.${entry.action === 'create' ? 'recorded' : entry.action === 'update' ? 'changed' : 'deleted'}` as TranslationKey)} tone={entry.action === 'delete' ? 'blush' : entry.action === 'update' ? 'honey' : 'sage'} />
              <Text variant="muted" className="text-[13px]">
                {when(entry.createdAt, locale)}
              </Text>
            </View>
            <Text variant="label" className="text-[16px]">
              {describe(entry, t)}
            </Text>
            {changedFields(entry, t).map((line) => (
              <Text key={line} variant="muted" className="text-[13px]">
                {line}
              </Text>
            ))}
            <Text variant="muted" className="text-[13px]">
              {t('funds.audit.by', { name: entry.actor })}
              {entry.reason ? ` · ${entry.reason}` : ''}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}
