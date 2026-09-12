import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { unregisterThisDevice } from '@/features/notifications/PushRegistrar';
import { colors } from '@/theme/tokens';
import { Avatar, Button, Card, Screen, Text } from '@/ui';

function Row({ icon, title, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; title: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={!onPress} className={`flex-row items-center gap-3 py-3.5 ${last ? '' : 'border-b border-border'}`}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-lavender">
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <Text variant="label" className="flex-1 text-[15px]">
        {title}
      </Text>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const leave = async () => {
    await unregisterThisDevice();
    await signOut();
  };
  const name = user?.displayName ?? 'Member';
  const version = Constants.expoConfig?.version ?? '';
  return (
    <Screen edges={['bottom']} className="gap-6 pt-6">
      <View className="items-center gap-3">
        <Avatar name={name} size={96} />
        <View className="items-center gap-1">
          <Text variant="display" className="text-[28px] leading-[34px]">
            {name}
          </Text>
          <Text variant="caption">{user?.email}</Text>
        </View>
        <Text variant="scripture" color="muted" className="max-w-[280px] text-center text-[17px] leading-[26px]">
          “She is clothed with strength and dignity.”
        </Text>
        <Text variant="caption">Proverbs 31:25</Text>
      </View>
      <Card className="py-1">
        <Row icon="notifications-outline" title="Notification settings" onPress={() => router.push('/notifications/settings')} />
        <Row icon="book-outline" title="My private journal" onPress={() => router.push('/journal')} />
        <Row icon="information-circle-outline" title={version ? `Prayer Warriors ${version}` : 'Prayer Warriors'} last />
      </Card>
      <View className="mt-auto">
        <Button title="Sign out" variant="danger" onPress={leave} />
      </View>
    </Screen>
  );
}
