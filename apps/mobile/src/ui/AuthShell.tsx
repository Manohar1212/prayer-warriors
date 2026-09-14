import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren, ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cardShadow, gradients } from '../theme/tokens';
import { KeyboardScroll } from './KeyboardScroll';
import { Text } from './Text';

const emblem = require('../../assets/logo-emblem.png');

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  /** Rendered under the card, for example a sign-out link or a note about invitations. */
  footer?: ReactNode;
}>;

/** The signed-out frame: brand purple, the emblem, a heading, and a white card that holds the form. */
export function AuthShell({ title, subtitle, footer, children }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: gradients.welcome[0] }}>
      <StatusBar style="light" />
      <LinearGradient colors={[...gradients.welcome]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardScroll
          bottomOffset={160}
          contentContainerClassName="flex-grow justify-center gap-6 px-5 py-6"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
            <View className="items-center gap-4">
              <Image source={emblem} accessibilityLabel="Prayer Warriors" style={{ width: 96, height: 94 }} resizeMode="contain" />
              <View className="items-center gap-1.5">
                <Text variant="display" color="cream" className="text-center text-[30px] leading-[36px]">
                  {title}
                </Text>
                {subtitle ? (
                  <Text variant="body" color="creamSoft" className="max-w-[300px] text-center text-[15px] leading-[22px]">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="gap-4 rounded-[28px] bg-surface p-5" style={cardShadow}>
              {children}
            </View>
            {footer ? <View className="items-center">{footer}</View> : null}
        </KeyboardScroll>
      </SafeAreaView>
    </View>
  );
}
