import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { isJoinable, useCalls } from '@/features/calls';
import { useMembers, type Member } from '@/features/members';
import { colors } from '@/theme/tokens';
import { Button, Card, Screen, Text } from '@/ui';

function MemberRow({ member }: { member: Member }) {
  const admin = member.role === 'admin';
  return (
    <View className="flex-row items-center gap-4 py-3">
      <View className={`h-11 w-11 items-center justify-center rounded-full ${admin ? 'bg-blush' : 'bg-sage'}`}>
        <Text variant="title" color={admin ? 'roseDeep' : 'primary'} className="text-[17px]">
          {member.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="label" className="text-[16px]">
          {member.displayName}
        </Text>
        {admin ? (
          <Text variant="muted" className="text-[13px]">
            Admin
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function callWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' });
}

export default function CommunityScreen() {
  const router = useRouter();
  const { members, loading, error, isAdmin, refresh } = useMembers();
  const { next } = useCalls();
  const count = members.length;
  const live = next?.status === 'live';

  // Pick up members added from the modal (and elsewhere) whenever this tab regains focus.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <Screen backdrop className="px-0 pt-0">
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        contentContainerClassName="flex-grow px-4 pb-8 pt-1"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="gap-6 pb-1">
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text variant="title">Group calls</Text>
                <View className="flex-row items-center gap-4">
                  <Pressable accessibilityRole="button" onPress={() => router.push('/calls/history')} hitSlop={8} className="py-1">
                    <Text variant="label" color="primary" className="text-[13px]">
                      History
                    </Text>
                  </Pressable>
                  {isAdmin ? <Button title="Schedule" size="compact" variant="secondary" onPress={() => router.push('/calls/schedule')} /> : null}
                </View>
              </View>
              {next ? (
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/calls/[id]', params: { id: next.id } })}>
                  <Card tone={live ? 'sage' : 'honey'} className="gap-3">
                    <View className="flex-row items-center gap-2">
                      <View className={`h-2 w-2 rounded-full ${live ? 'bg-primary' : 'bg-gold'}`} />
                      <Text variant="label" color={live ? 'primary' : 'gold'} className="text-[13px]">
                        {live ? 'Happening now' : callWhen(next.scheduledAt)}
                      </Text>
                    </View>
                    <Text variant="title" className="text-[22px]">
                      {next.title}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <Text variant="muted" className="text-[13px]">
                        {next.participantCount === 0 ? 'No one has joined yet' : next.participantCount === 1 ? '1 joined' : `${next.participantCount} joined`}
                      </Text>
                      <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${live || isJoinable(next, new Date()) ? 'bg-primary' : 'bg-surface'}`}>
                        <Ionicons name="call" size={13} color={live || isJoinable(next, new Date()) ? colors.cream : colors.primary} />
                        <Text variant="label" color={live || isJoinable(next, new Date()) ? 'cream' : 'primary'} className="text-[13px]">
                          {live || isJoinable(next, new Date()) ? 'Join' : 'Details'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ) : (
                <Text variant="muted" className="text-[15px] leading-[22px]">
                  No call scheduled yet.{isAdmin ? ' Schedule one and everyone gets a reminder.' : ''}
                </Text>
              )}
            </View>
            <View className="flex-row items-center justify-between border-b border-border pb-2">
              <Text variant="title">{count === 1 ? '1 member' : `${count} members`}</Text>
              {isAdmin ? <Button title="Add member" size="compact" onPress={() => router.push('/add-member')} /> : null}
            </View>
            {error ? (
              <Text variant="muted" color="rose">
                {error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} className="mt-10" />
          ) : (
            <Text variant="muted" className="mt-6">
              No members yet.
            </Text>
          )
        }
        renderItem={({ item }) => <MemberRow member={item} />}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
      />
    </Screen>
  );
}
