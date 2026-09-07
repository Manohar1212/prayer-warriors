import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Input, Screen, Text } from '@/ui';

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
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">
          Welcome
        </Text>
        <Text variant="muted">How should the group know you?</Text>
      </View>
      <View className="gap-4">
        <Input
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={40}
          error={error}
        />
        <Button
          title="Continue"
          onPress={submit}
          loading={busy}
          disabled={displayName.trim().length === 0}
        />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}
