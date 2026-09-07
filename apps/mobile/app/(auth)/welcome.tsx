import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Text } from '@/ui';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <Screen className="justify-between">
      <View className="flex-1 items-center justify-center gap-3">
        <Text variant="display" className="text-4xl text-primary">
          Prayer Warriors
        </Text>
        <Text variant="muted" className="text-center text-base">
          A private prayer circle for our fellowship.
        </Text>
      </View>
      <View className="gap-3">
        <Button title="Sign in" onPress={() => router.push('/(auth)/login')} />
        <Text variant="muted" className="text-center">
          Membership is by invitation. Ask your group admin for access.
        </Text>
      </View>
    </Screen>
  );
}
