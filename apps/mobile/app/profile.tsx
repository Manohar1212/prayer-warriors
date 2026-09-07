import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Card, Screen, Text } from '@/ui';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  return (
    <Screen className="gap-4">
      <Card className="gap-1">
        <Text variant="title">{user?.displayName ?? 'Member'}</Text>
        <Text variant="muted">{user?.email}</Text>
      </Card>
      <View className="mt-auto">
        <Button title="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}
