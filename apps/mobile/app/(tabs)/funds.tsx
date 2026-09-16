import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { formatRupees, useFunds, type Transaction } from '@/features/funds';
import { useMembers } from '@/features/members';
import { shortDate } from '@/lib/time';
import { useLanguage } from '@/i18n';
import { colors, fonts } from '@/theme/tokens';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { Aurora, Card, Screen, TabHeader, Text } from '@/ui';

function TransactionRow({ tx, onPress, last }: { tx: Transaction; onPress: () => void; last: boolean }) {
  const { locale } = useLanguage();
  const credit = tx.kind === 'contribution';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={`flex-row items-center gap-3 py-3 ${last ? '' : 'border-b border-border'}`}>
      <View className={`h-10 w-10 items-center justify-center rounded-full ${credit ? 'bg-sage' : 'bg-blush'}`}>
        <Ionicons name={credit ? 'arrow-up' : 'arrow-down'} size={16} color={credit ? colors.leaf : colors.roseDeep} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="label" className="text-[15px]" numberOfLines={1}>
          {tx.title}
        </Text>
        <Text variant="caption">
          {tx.subtitle} · {shortDate(tx.date, locale)}
        </Text>
      </View>
      <Text variant="label" color={credit ? 'leaf' : 'roseDeep'} className="text-[15px]">
        {credit ? '+' : ''}
        {formatRupees(tx.signedPaise)}
      </Text>
    </Pressable>
  );
}

export default function FundsScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { isAdmin } = useMembers();
  const { transactions, balancePaise, thisMonth, loading, error, refresh } = useFunds();
  const monthName = new Date().toLocaleDateString(locale, { month: 'long' });

  return (
    <Screen edges={['top']} backdrop className="px-0 pt-0">
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-24 pt-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <TabHeader title={t('funds.title')} subtitle={t('funds.subtitle')} right={<HeaderActions />} />
        <View style={{ borderRadius: 22, padding: 20, gap: 14, overflow: 'hidden' }}>
          <Aurora palette="plum" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View>
            <View className="gap-1">
              <Text variant="caption" color="creamSoft">
                {t('funds.balance')}
              </Text>
              <Text color="cream" style={{ fontFamily: fonts.numeric, fontSize: 28, lineHeight: 34 }}>
                {formatRupees(balancePaise)}
              </Text>
            </View>
          </View>
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text variant="caption" color="creamSoft">
                {t('funds.collected', { month: monthName })}
              </Text>
              <Text variant="label" color="cream" className="text-[15px]">
                {formatRupees(thisMonth.collectedPaise)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text variant="caption" color="creamSoft">
                {t('funds.expenses', { month: monthName })}
              </Text>
              <Text variant="label" color="cream" className="text-[15px]">
                {formatRupees(thisMonth.spentPaise)}
              </Text>
            </View>
          </View>
          {isAdmin ? (
            <View className="flex-row gap-2">
              <Pressable accessibilityRole="button" onPress={() => router.push('/funds/contribution')} className="flex-1 items-center rounded-full bg-surface py-2.5">
                <Text variant="label" color="primary" className="text-[13px]">
                  {t('funds.recordContribution')}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/funds/expense')} className="flex-1 items-center rounded-full bg-surface/20 py-2.5">
                <Text variant="label" color="cream" className="text-[13px]">
                  {t('funds.recordExpense')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View className="flex-row gap-5 px-1">
          <Pressable accessibilityRole="button" onPress={() => router.push('/funds/report')} className="flex-row items-center gap-1.5 py-1">
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text variant="label" color="primary" className="text-[13px]">
              {t('funds.monthlyReport')}
            </Text>
          </Pressable>
          {isAdmin ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/funds/audit')} className="flex-row items-center gap-1.5 py-1">
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text variant="label" color="primary" className="text-[13px]">
                {t('funds.changeHistory')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <Text variant="caption" color="roseDeep">
            {error}
          </Text>
        ) : null}

        <Text variant="title" className="text-[17px]">
          {t('funds.recent')}
        </Text>
        {loading && !transactions.length ? (
          <ActivityIndicator color={colors.primary} className="mt-2" />
        ) : transactions.length ? (
          <Card className="py-1">
            {transactions.map((tx, i) => (
              <TransactionRow
                key={`${tx.kind}-${tx.id}`}
                tx={tx}
                last={i === transactions.length - 1}
                onPress={() => router.push({ pathname: tx.kind === 'contribution' ? '/funds/contribution' : '/funds/expense', params: { id: tx.id } })}
              />
            ))}
          </Card>
        ) : (
          <Text variant="muted" className="max-w-[300px] text-[15px] leading-[22px]">
            {isAdmin ? t('funds.emptyAdmin') : t('funds.emptyMember')}
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
