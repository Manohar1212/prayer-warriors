import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '../theme/tokens';
import { Backdrop } from './Backdrop';

export type ScreenTone = 'cream' | 'forest';

type Props = PropsWithChildren<{
  scroll?: boolean;
  tone?: ScreenTone;
  backdrop?: boolean;
  /**
   * Which safe-area edges this screen must pad itself. Navigators already pad the edges they own:
   * a native header covers the top, a tab bar covers the bottom. Default: none (a screen inside
   * a header + tab bar). Pass ['top'] for header-less screens, ['bottom'] for stack/modal screens
   * without a tab bar, ['top', 'bottom'] for full-screen ones like Welcome.
   */
  edges?: Edge[];
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
  edges = [],
  className = '',
}: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerClassName={`flex-grow px-4 pb-8 pt-4 ${className}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-4 pb-8 pt-4 ${className}`}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background[tone] }} edges={edges}>
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
