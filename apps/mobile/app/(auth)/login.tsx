import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useAuth } from '@/features/auth';
import { useT } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Input, Text } from '@/ui';
import { AuthShell } from '@/ui/AuthShell';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      backTo="/(auth)/welcome"
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <Text variant="caption" color="muted" className="text-center">
          {t('welcome.invitation')}
        </Text>
      }
    >
      <Input
        label={t('common.email')}
        variant="filled"
        placeholder={t('login.emailPlaceholder')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label={t('login.password')}
        variant="filled"
        placeholder={t('login.passwordPlaceholder')}
        secureTextEntry={!show}
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
        error={error}
        right={
          <Pressable accessibilityRole="button" accessibilityLabel={show ? t('login.hidePassword') : t('login.showPassword')} onPress={() => setShow((s) => !s)} hitSlop={8}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
          </Pressable>
        }
      />
      <Button title={t('welcome.signIn')} variant="primary" onPress={submit} loading={busy} disabled={!email.trim() || !password} className="mt-1" />
      <Link href="/(auth)/forgot-password" asChild>
        <Pressable accessibilityRole="link" className="self-center py-1">
          <Text variant="label" color="muted" className="text-[14px]">
            {t('login.forgot')}
          </Text>
        </Pressable>
      </Link>
    </AuthShell>
  );
}
