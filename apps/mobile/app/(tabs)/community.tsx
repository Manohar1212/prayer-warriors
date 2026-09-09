import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { isJoinable, useCalls } from '@/features/calls';
import { useMembers, type Member } from '@/features/members';
import { colors } from '@/theme/tokens';
import { Badge, Button, Card, Screen, Text } from '@/ui';

function MemberRow({ member }: { member: Member }) {
  const admin = member.role === 'admin';
  return (
    <View className="flex-row items-center gap-4 py-3">
      <View
        className={`h-12 w-12 items-center justify-center rounded-full ${admin ? 'bg-blush' : 'bg-sage'}`}
      >
        <Text variant="title" color={admin ? 'roseDeep' : 'primary'} className="text-[18px]">
          {member.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="title" className="text-[17px] leading-[22px]">
          {member.displayName}
        </Text>
        {admin ? <Text variant="muted">Admin</Text> : null}
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const router = useRouter();
  const { members, loading, error, isAdmin, refresh } = useMembers();
  const { next } = useCalls();
  const count = members.length;

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
        contentContainerClassName="flex-grow px-4 pb-8 pt-2"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View className="mb-2 gap-4">
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text variant="title">Group calls</Text>
                <Pressable accessibilityRole="button" onPress={() => router.push('/calls/history')} hitSlop={8} className="py-1">
                  <Text variant="label" color="primary" className="text-[13px]">
                    History
                  </Text>
                </Pressable>
              </View>
              {next ? (
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/calls/[id]', params: { id: next.id } })}>
                  <Card tone={next.status === 'live' ? 'sage' : 'surface'} className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Badge label={next.status === 'live' ? 'Happening now' : 'Next call'} tone={next.status === 'live' ? 'sage' : 'honey'} />
                      <Text variant="muted" className="text-[13px]">
                        {new Date(next.scheduledAt).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text variant="title" className="text-[18px]">
                      {next.title}
                    </Text>
                    <Text variant="label" color="primary">
                      {isJoinable(next, new Date()) ? 'Join now' : 'View details'}
                    </Text>
                  </Card>
                </Pressable>
              ) : (
                <Text variant="muted" className="text-[15px]">
                  No call scheduled.
                </Text>
              )}
              {isAdmin ? <Button title="Schedule a call" variant="secondary" onPress={() => router.push('/calls/schedule')} /> : null}
            </View>
            <Text variant="muted">
              {count === 1 ? '1 member' : `${count} members`}
            </Text>
            {isAdmin ? (
              <Button title="Add member" onPress={() => router.push('/add-member')} />
            ) : null}
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
