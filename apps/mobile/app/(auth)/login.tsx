import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Input, Screen, Text } from '@/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">
          Welcome back
        </Text>
        <Text variant="muted">Sign in with the email your admin invited.</Text>
      </View>
      <View className="gap-4">
        <Input
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Sign in" onPress={() => {}} />
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable accessibilityRole="link" className="self-center py-2">
            <Text variant="label" className="text-primary">
              Forgot password?
            </Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
