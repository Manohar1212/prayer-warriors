import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useAuth } from '@/features/auth';
import { useT } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Input, Text } from '@/ui';
import { AuthShell } from '@/ui/AuthShell';

const MIN_PASSWORD = 8;

/**
 * First sign-in on an account an admin made: the starting password was shared over WhatsApp,
 * so the member chooses their own before anything else opens.
 */
export default function SetPasswordScreen() {
  const { setPassword, signOut } = useAuth();
  const t = useT();
  const [password, setPasswordText] = useState('');
  const [repeat, setRepeat] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (password.length < MIN_PASSWORD) return setError(t('password.tooShort', { n: MIN_PASSWORD }));
    if (password !== repeat) return setError(t('password.mismatch'));
    setBusy(true);
    setError(null);
    try {
      await setPassword(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('password.failed'));
    } finally {
      setBusy(false);
    }
  }

  const eye = (
    <Pressable accessibilityRole="button" accessibilityLabel={show ? t('login.hidePassword') : t('login.showPassword')} onPress={() => setShow((s) => !s)} hitSlop={8}>
      <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
    </Pressable>
  );

  return (
    <AuthShell
      icon="key-outline"
      title={t('password.title')}
      subtitle={t('password.subtitle')}
      footer={
        <Pressable accessibilityRole="button" onPress={signOut} hitSlop={8} className="py-1">
          <Text variant="label" color="muted" className="text-[14px]">
            {t('setup.signOut')}
          </Text>
        </Pressable>
      }
    >
      <Input
        left="lock-closed-outline"
        placeholder={t('password.new')}
        secureTextEntry={!show}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        value={password}
        onChangeText={setPasswordText}
        autoFocus
        right={eye}
      />
      <Input
        left="lock-closed-outline"
        placeholder={t('password.repeat')}
        secureTextEntry={!show}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        value={repeat}
        onChangeText={setRepeat}
        onSubmitEditing={submit}
        error={error}
      />
      <Button title={t('password.save')} onPress={submit} loading={busy} disabled={!password || !repeat} className="mt-1" />
    </AuthShell>
  );
}
