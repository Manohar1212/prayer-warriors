import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Input, Screen, Text } from '@/ui';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

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
          onSubmitEditing={submit}
          error={error}
        />
        <Button
          title="Sign in"
          onPress={submit}
          loading={busy}
          disabled={!email.trim() || !password}
        />
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
