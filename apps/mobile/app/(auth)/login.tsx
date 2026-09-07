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
    <Screen scroll className="justify-center gap-10">
      <View className="gap-2">
        <Text variant="display" color="primary">
          Sign in
        </Text>
        <Text variant="muted" className="text-[15px] leading-[22px]">
          Use the email your group admin added.
        </Text>
      </View>
      <View className="gap-5">
        <Input
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
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
          className="mt-1"
        />
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable accessibilityRole="link" className="self-start py-1">
            <Text variant="label" color="primary">
              Forgot your password?
            </Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
