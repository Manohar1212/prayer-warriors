import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useT } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Input, Text } from '@/ui';
import { AuthShell } from '@/ui/AuthShell';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const t = useT();
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
      setError(err instanceof Error ? err.message : t('forgot.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      backTo="/(auth)/login"
      icon={sent ? 'mail-open-outline' : 'lock-closed-outline'}
      title={sent ? t('forgot.sentTitle') : t('forgot.title')}
      subtitle={sent ? t('forgot.sentBody', { email: email.trim() }) : t('forgot.subtitle')}
      footer={
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8} className="py-1">
          <Text variant="label" color="primary" className="text-[14px]">
            {t('forgot.backToSignIn')}
          </Text>
        </Pressable>
      }
    >
      {sent ? (
        <View className="items-center py-2">
          <Ionicons name="checkmark-circle" size={36} color={colors.leaf} />
        </View>
      ) : (
        <>
          <Input
            left="mail-outline"
            placeholder={t('common.email')}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="go"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={submit}
            error={error}
          />
          <Button title={t('forgot.send')} onPress={submit} loading={busy} disabled={!email.trim()} className="mt-1" />
        </>
      )}
    </AuthShell>
  );
}
