import { View } from 'react-native';

import { Button, Card, Screen, Text } from '@/ui';

export default function ProfileScreen() {
  return (
    <Screen className="gap-4">
      <Card className="gap-1">
        <Text variant="title">Member</Text>
        <Text variant="muted">member@example.com</Text>
      </Card>
      <View className="mt-auto">
        <Button title="Sign out" variant="secondary" onPress={() => {}} />
      </View>
    </Screen>
  );
}
