import { useState } from 'react';
import { Pressable } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Input, Text } from '@/ui';
import { AuthShell } from '@/ui/AuthShell';

export default function AccountSetupScreen() {
  const { updateProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ displayName });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your name.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="What should we call you?"
      subtitle="This is the name the group will see on your prayers and in calls."
      footer={
        <Pressable accessibilityRole="button" onPress={signOut} hitSlop={8} className="py-1">
          <Text variant="label" color="creamSoft" className="text-[14px]">
            Sign out
          </Text>
        </Pressable>
      }
    >
      <Input label="Your name" variant="filled" placeholder="e.g. Mary Joseph" value={displayName} onChangeText={setDisplayName} onSubmitEditing={submit} maxLength={40} autoFocus error={error} />
      <Button title="Continue" onPress={submit} loading={busy} disabled={displayName.trim().length === 0} className="mt-1" />
    </AuthShell>
  );
}
