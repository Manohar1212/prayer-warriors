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
    <Screen scroll backdrop className="justify-center gap-10">
      <View className="gap-2">
        <Text variant="display" color="primary">
          What should we call you?
        </Text>
        <Text variant="muted" className="text-[15px] leading-[22px]">
          This is the name the group will see on your prayers and in calls.
        </Text>
      </View>
      <View className="gap-5">
        <Input
          label="Your name"
          value={displayName}
          onChangeText={setDisplayName}
          onSubmitEditing={submit}
          maxLength={40}
          autoFocus
          error={error}
        />
        <Button
          title="Continue"
          onPress={submit}
          loading={busy}
          disabled={displayName.trim().length === 0}
          className="mt-1"
        />
        <Button title="Sign out" variant="ghost" onPress={signOut} className="self-start px-0" />
      </View>
    </Screen>
  );
}
