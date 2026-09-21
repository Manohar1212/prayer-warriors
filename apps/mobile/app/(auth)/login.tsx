import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useAuth } from '@/features/auth';
import { useLanguage, type Language } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Input, Segments, Text } from '@/ui';
import { AuthShell } from '@/ui/AuthShell';

const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'తెలుగు' },
];

/** Sign in, with the app's language chosen right here: the screen switches the moment it is tapped. */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const { t, language, setLanguage } = useLanguage();
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
      brand
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <Text variant="caption" className="text-center">
          {t('welcome.invitation')}
        </Text>
      }
    >
      <Segments variant="pill" options={languages} value={language} onChange={setLanguage} />
      <Input
        left="mail-outline"
        placeholder={t('common.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        left="lock-closed-outline"
        placeholder={t('login.password')}
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
      <Button title={t('welcome.signIn')} onPress={submit} loading={busy} disabled={!email.trim() || !password} className="mt-1" />
      <Link href="/(auth)/forgot-password" asChild>
        <Pressable accessibilityRole="link" className="self-center py-1">
          <Text variant="label" color="primary" className="text-[14px]">
            {t('login.forgot')}
          </Text>
        </Pressable>
      </Link>
    </AuthShell>
  );
}
