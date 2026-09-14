import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { colors } from '@/theme/tokens';
import { Button, Input, Text } from '@/ui';
import { AuthShell } from '@/ui/AuthShell';

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
    <AuthShell
      title="Reset your password"
      subtitle={sent ? undefined : 'Enter your email and we will send you a link to choose a new one.'}
      footer={
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8} className="py-1">
          <Text variant="label" color="creamSoft" className="text-[14px]">
            {sent ? 'Back to sign in' : 'Cancel'}
          </Text>
        </Pressable>
      }
    >
      {sent ? (
        <View className="items-center gap-3 py-2">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-sage">
            <Ionicons name="mail-open-outline" size={24} color={colors.leaf} />
          </View>
          <Text variant="title" className="text-center text-[20px]">
            Check your email
          </Text>
          <Text variant="muted" className="text-center text-[15px] leading-[22px]">
            A reset link is on its way to {email.trim()}. Open it to choose a new password.
          </Text>
        </View>
      ) : (
        <>
          <Input
            label="Email"
            variant="filled"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="go"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={submit}
            error={error}
          />
          <Button title="Send reset link" onPress={submit} loading={busy} disabled={!email.trim()} className="mt-1" />
        </>
      )}
    </AuthShell>
  );
}
