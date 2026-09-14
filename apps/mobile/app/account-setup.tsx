import { useState } from 'react';
import { Pressable } from 'react-native';

import { useAuth } from '@/features/auth';
import { useT } from '@/i18n';
import { Button, Input, Text } from '@/ui';
import { AuthShell } from '@/ui/AuthShell';

export default function AccountSetupScreen() {
  const { updateProfile, signOut } = useAuth();
  const t = useT();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ displayName });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setup.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t('setup.title')}
      subtitle={t('setup.subtitle')}
      footer={
        <Pressable accessibilityRole="button" onPress={signOut} hitSlop={8} className="py-1">
          <Text variant="label" color="creamSoft" className="text-[14px]">
            {t('setup.signOut')}
          </Text>
        </Pressable>
      }
    >
      <Input label={t('setup.name')} variant="glass" placeholder={t('setup.namePlaceholder')} value={displayName} onChangeText={setDisplayName} onSubmitEditing={submit} maxLength={40} autoFocus error={error} />
      <Button title={t('setup.continue')} variant="inverse" onPress={submit} loading={busy} disabled={displayName.trim().length === 0} className="mt-1" />
    </AuthShell>
  );
}
