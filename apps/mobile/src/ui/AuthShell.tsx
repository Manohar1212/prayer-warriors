import { StatusBar } from 'expo-status-bar';
import type { Href } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from './Backdrop';
import { HeaderBack } from './HeaderBack';
import { Text } from './Text';

const emblem = require('../../assets/logo-emblem.png');

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  /** Rendered under the form, for example a sign-out link or a note about invitations. */
  footer?: ReactNode;
  /** Where the top-left back control leads; omit it to hide the control. */
  backTo?: Href;
}>;

/**
 * The signed-out frame: the bloom page, the emblem, a heading, and the form.
 * The keyboard drives one continuous motion: the block lifts with the keyboard's own frames while
 * the emblem and footer fold away, so nothing scrolls or jumps.
 */
export function AuthShell({ title, subtitle, footer, backTo, children }: Props) {
  const insets = useSafeAreaInsets();
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
    <View style={{ flex: 1, backgroundColor: '#FBE9E1' }}>
      <StatusBar style="dark" />
      <Backdrop />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {backTo ? (
          <View style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 1 }}>
            <HeaderBack fallback={backTo} />
          </View>
        ) : null}
        <Animated.View style={[{ flex: 1 }, lift]}>
          <ScrollView
            contentContainerClassName="flex-grow justify-center gap-6 px-5 py-6"
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center">
              <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, fold]}>
                <Image source={emblem} accessibilityLabel="Prayer Warriors" style={{ width: 96, height: 94 }} resizeMode="contain" />
              </Animated.View>
              <View className="items-center gap-1.5">
                <Text variant="display" className="text-center text-[24px] leading-[30px]">
                  {title}
                </Text>
                {subtitle ? (
                  <Text variant="body" color="muted" className="max-w-[300px] text-center text-[15px] leading-[22px]">
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
