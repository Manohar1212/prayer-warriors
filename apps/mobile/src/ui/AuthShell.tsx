import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren, ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gradients } from '../theme/tokens';
import { Text } from './Text';

const emblem = require('../../assets/logo-emblem.png');

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  /** Rendered under the card, for example a sign-out link or a note about invitations. */
  footer?: ReactNode;
}>;

/**
 * The signed-out frame: brand purple, the emblem, a heading, and a white card that holds the form.
 * The keyboard drives one continuous motion: the block lifts with the keyboard's own frames while
 * the emblem and footer fold away, so nothing scrolls or jumps.
 */
export function AuthShell({ title, subtitle, footer, children }: Props) {
  const { height, progress } = useReanimatedKeyboardAnimation();
  const lift = useAnimatedStyle(() => ({ paddingBottom: -height.value }));
  const fold = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    height: interpolate(progress.value, [0, 1], [94, 0]),
    marginBottom: interpolate(progress.value, [0, 1], [16, 0]),
  }));
  const footerFold = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    maxHeight: interpolate(progress.value, [0, 1], [60, 0]),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: gradients.welcome[0] }}>
      <StatusBar style="light" />
      <LinearGradient colors={[...gradients.welcome]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <Animated.View style={[{ flex: 1 }, lift]}>
          <ScrollView
            contentContainerClassName="flex-grow justify-center gap-6 px-5 py-6"
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center">
              <Animated.View style={[{ overflow: 'hidden', alignItems: 'center' }, fold]}>
                <Image source={emblem} accessibilityLabel="Prayer Warriors" style={{ width: 96, height: 94 }} resizeMode="contain" />
              </Animated.View>
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
            <View className="gap-4 px-1">{children}</View>
            {footer ? (
              <Animated.View style={[{ overflow: 'hidden', alignItems: 'center' }, footerFold]}>
                {footer}
              </Animated.View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
