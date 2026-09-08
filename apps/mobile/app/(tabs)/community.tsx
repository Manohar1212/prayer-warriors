import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { useMembers, type Member } from '@/features/members';
import { colors } from '@/theme/tokens';
import { Button, Screen, Text } from '@/ui';

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
        contentContainerClassName="flex-grow px-6 pb-8 pt-2"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View className="mb-2 gap-4">
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
