import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Card, Screen, Text } from '@/ui';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const initial = (user?.displayName ?? user?.email ?? '?').trim().charAt(0).toUpperCase();
  return (
    <Screen backdrop className="gap-6 pt-6">
      <Card className="gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-honey">
          <Text variant="title" color="primary">
            {initial}
          </Text>
        </View>
        <View className="gap-1">
          <Text variant="title">{user?.displayName ?? 'Member'}</Text>
          <Text variant="muted">{user?.email}</Text>
        </View>
      </Card>
      <View className="mt-auto">
        <Button title="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}
