import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/ui';

export default function AccountSetupScreen() {
  const [displayName, setDisplayName] = useState('');
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
        />
        <Button
          title="Continue"
          onPress={() => {}}
          disabled={displayName.trim().length === 0}
        />
      </View>
    </Screen>
  );
}
