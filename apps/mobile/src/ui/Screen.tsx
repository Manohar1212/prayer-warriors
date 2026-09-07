import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/tokens';

type Props = PropsWithChildren<{ scroll?: boolean; className?: string }>;

export function Screen({ children, scroll = false, className = '' }: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerClassName={`flex-grow p-5 ${className}`}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 p-5 ${className}`}>{children}</View>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.cream }}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
