import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { Href } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/tokens';
import { CrossMark } from './CrossMark';
import { HeaderBack } from './HeaderBack';
import { Text } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  /** Rendered under the form, for example a sign-out link or a note about invitations. */
  footer?: ReactNode;
  /** Where the top-left back control leads; omit it to hide the control. */
  backTo?: Href;
  /** Show the cross, the app name and the motto above the title (the sign-in screen). */
  brand?: boolean;
  /** Or a single icon in a tinted disc above the title (forgot password, account setup). */
  icon?: IconName;
}>;

/**
 * The signed-out frame: white page, a mark above the title, the form, a footer. The keyboard
 * drives one continuous motion: the block lifts with the keyboard's own frames while the mark
 * and footer fold away, so nothing scrolls or jumps.
 */
export function AuthShell({ title, subtitle, footer, backTo, brand = false, icon, children }: Props) {
  const insets = useSafeAreaInsets();
  const { height, progress } = useReanimatedKeyboardAnimation();
  const lift = useAnimatedStyle(() => ({ paddingBottom: -height.value }));
  const fold = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    height: interpolate(progress.value, [0, 1], [brand ? 120 : 96, 0]),
    marginBottom: interpolate(progress.value, [0, 1], [12, 0]),
  }));
  const footerFold = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    maxHeight: interpolate(progress.value, [0, 1], [60, 0]),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {backTo ? (
          <View style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 1 }}>
            <HeaderBack fallback={backTo} />
          </View>
        ) : null}
        <Animated.View style={[{ flex: 1 }, lift]}>
          <ScrollView contentContainerClassName="flex-grow justify-center gap-6 px-6 py-6" keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
            <View className="items-center">
              <Animated.View style={[{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, fold]}>
                {brand ? (
                  <View className="items-center gap-1.5">
                    <CrossMark size={44} color={colors.primary} />
                    <Text variant="title" className="text-[24px] leading-[30px]">
                      Prayer Warriors
                    </Text>
                    <Text variant="caption" style={{ letterSpacing: 3 }}>
                      PRAY · GROW · SERVE
                    </Text>
                  </View>
                ) : (
                  <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-sky">
                    <Ionicons name={icon ?? 'person-outline'} size={30} color={colors.primary} />
                  </View>
                )}
              </Animated.View>
              <View className="items-center gap-1.5">
                <Text variant="display" className="text-center text-[24px] leading-[30px]">
                  {title}
                </Text>
                {subtitle ? (
                  <Text variant="muted" className="max-w-[300px] text-center">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="gap-3">{children}</View>
            {footer ? <Animated.View style={[{ overflow: 'hidden', alignItems: 'center' }, footerFold]}>{footer}</Animated.View> : null}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
