import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/tokens';
import { Backdrop } from './Backdrop';

export type ScreenTone = 'cream' | 'forest';

type Props = PropsWithChildren<{
  scroll?: boolean;
  tone?: ScreenTone;
  backdrop?: boolean;
  className?: string;
}>;

const background: Record<ScreenTone, string> = {
  cream: colors.cream,
  forest: colors.primaryDark,
};

export function Screen({
  children,
  scroll = false,
  tone = 'cream',
  backdrop = false,
  className = '',
}: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerClassName={`flex-grow px-6 pb-8 pt-4 ${className}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-6 pb-8 pt-4 ${className}`}>{children}</View>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: background[tone] }}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {backdrop ? <Backdrop /> : null}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
