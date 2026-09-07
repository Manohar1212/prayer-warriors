import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Input, Screen, Text } from '@/ui';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">
          Reset password
        </Text>
        <Text variant="muted">We will email you a link to choose a new password.</Text>
      </View>
      {sent ? (
        <Text>Check your inbox for the reset link.</Text>
      ) : (
        <View className="gap-4">
          <Input
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={error}
          />
          <Button
            title="Send reset link"
            onPress={submit}
            loading={busy}
            disabled={!email.trim()}
          />
        </View>
      )}
      <Button title="Back to sign in" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
