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
    <Screen scroll className="justify-center gap-10">
      <View className="gap-2">
        <Text variant="display" color="primary">
          Reset your password
        </Text>
        <Text variant="muted" className="text-[15px] leading-[22px]">
          {sent
            ? `A reset link is on its way to ${email.trim()}. Open it to choose a new password.`
            : 'Enter your email and we will send you a link to choose a new one.'}
        </Text>
      </View>
      {sent ? null : (
        <View className="gap-5">
          <Input
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={submit}
            error={error}
          />
          <Button
            title="Send reset link"
            onPress={submit}
            loading={busy}
            disabled={!email.trim()}
            className="mt-1"
          />
        </View>
      )}
      <Button
        title={sent ? 'Back to sign in' : 'Cancel'}
        variant="ghost"
        onPress={() => router.back()}
        className="self-start px-0"
      />
    </Screen>
  );
}
