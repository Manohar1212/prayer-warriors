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
      title={t('forgot.title')}
      subtitle={sent ? undefined : t('forgot.subtitle')}
      footer={
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8} className="py-1">
          <Text variant="label" color="creamSoft" className="text-[14px]">
            {sent ? t('forgot.backToSignIn') : t('common.cancel')}
          </Text>
        </Pressable>
      }
    >
      {sent ? (
        <View className="items-center gap-3 py-2">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-surface/15">
            <Ionicons name="mail-open-outline" size={24} color={colors.goldLight} />
          </View>
          <Text variant="title" color="cream" className="text-center text-[17px]">
            {t('forgot.sentTitle')}
          </Text>
          <Text variant="body" color="creamSoft" className="text-center text-[15px] leading-[22px]">
            {t('forgot.sentBody', { email: email.trim() })}
          </Text>
        </View>
      ) : (
        <>
          <Input
            label={t('common.email')}
            variant="glass"
            placeholder={t('login.emailPlaceholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="go"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={submit}
            error={error}
          />
          <Button title={t('forgot.send')} variant="inverse" onPress={submit} loading={busy} disabled={!email.trim()} className="mt-1" />
        </>
      )}
    </AuthShell>
  );
}
