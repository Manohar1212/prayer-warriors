import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { formatRupees, useFunds, type Transaction } from '@/features/funds';
import { useMembers } from '@/features/members';
import { colors } from '@/theme/tokens';
import { Button, Screen, Text } from '@/ui';

function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function TransactionRow({ tx, onPress }: { tx: Transaction; onPress: () => void }) {
  const credit = tx.kind === 'contribution';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="flex-row items-center gap-4 py-3">
      <View className={`h-10 w-10 items-center justify-center rounded-full ${credit ? 'bg-sage' : 'bg-blush'}`}>
        <Ionicons name={credit ? 'arrow-down' : 'arrow-up'} size={18} color={credit ? colors.primary : colors.roseDeep} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="label" className="text-[16px]">
          {tx.title}
        </Text>
        <Text variant="muted" className="text-[13px]">
          {tx.subtitle} · {shortDate(tx.date)}
        </Text>
      </View>
      <Text variant="label" color={credit ? 'primary' : 'roseDeep'} className="text-[16px]">
        {credit ? '+' : ''}
        {formatRupees(tx.signedPaise)}
      </Text>
    </Pressable>
  );
}

export default function FundsScreen() {
  const router = useRouter();
  const { isAdmin } = useMembers();
  const { transactions, balancePaise, thisMonth, loading, error, refresh } = useFunds();
  const monthName = new Date().toLocaleDateString(undefined, { month: 'long' });

  return (
    <Screen backdrop className="px-0 pt-0">
      <FlatList
        data={transactions}
        keyExtractor={(t) => `${t.kind}-${t.id}`}
        contentContainerClassName="flex-grow px-6 pb-8 pt-2"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="mb-2 gap-5">
            <View className="gap-4 rounded-[24px] bg-primary p-6">
              <Text variant="label" color="creamSoft">
                Current balance
              </Text>
              <Text variant="display" color="cream" className="text-[40px] leading-[46px]">
                {formatRupees(balancePaise)}
              </Text>
              <View className="flex-row gap-4">
                <View className="flex-1 gap-0.5">
                  <Text variant="muted" color="creamFaint" className="text-[12px]">
                    {monthName} collected
                  </Text>
                  <Text variant="label" color="cream" className="text-[16px]">
                    {formatRupees(thisMonth.collectedPaise)}
                  </Text>
                </View>
                <View className="flex-1 gap-0.5">
                  <Text variant="muted" color="creamFaint" className="text-[12px]">
                    {monthName} expenses
                  </Text>
                  <Text variant="label" color="cream" className="text-[16px]">
                    {formatRupees(thisMonth.spentPaise)}
                  </Text>
                </View>
              </View>
            </View>
            {isAdmin ? (
              <View className="flex-row gap-3">
                <Button title="Contribution" onPress={() => router.push('/funds/contribution')} className="flex-1" />
                <Button title="Expense" variant="secondary" onPress={() => router.push('/funds/expense')} className="flex-1" />
              </View>
            ) : null}
            <View className="flex-row gap-5">
              <Pressable accessibilityRole="button" onPress={() => router.push('/funds/report')} className="flex-row items-center gap-2 py-1">
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <Text variant="label" color="primary">
                  Monthly report
                </Text>
              </Pressable>
              {isAdmin ? (
                <Pressable accessibilityRole="button" onPress={() => router.push('/funds/audit')} className="flex-row items-center gap-2 py-1">
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text variant="label" color="primary">
                    Change history
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {error ? (
              <Text variant="muted" color="rose">
                {error}
              </Text>
            ) : null}
            <Text variant="title">Recent transactions</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} className="mt-6" />
          ) : (
            <Text variant="muted" className="mt-2 max-w-[300px] text-[15px] leading-[22px]">
              Nothing recorded yet. {isAdmin ? 'Record the first contribution or expense above.' : 'Your admin will record contributions and expenses here.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <TransactionRow
            tx={item}
            onPress={() => router.push({ pathname: item.kind === 'contribution' ? '/funds/contribution' : '/funds/expense', params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
      />
    </Screen>
  );
}
