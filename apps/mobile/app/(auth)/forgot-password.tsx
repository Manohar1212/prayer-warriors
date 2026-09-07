import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/ui';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">
          Reset password
        </Text>
        <Text variant="muted">We will email you a link to choose a new password.</Text>
      </View>
      <View className="gap-4">
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Button title="Send reset link" onPress={() => {}} />
        <Button title="Back to sign in" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
