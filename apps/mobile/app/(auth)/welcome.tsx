import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, View } from 'react-native';

import { colors } from '@/theme/tokens';
import { Button, Mark, Screen, Text } from '@/ui';

export default function WelcomeScreen() {
  const router = useRouter();
  const settle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        settle.setValue(1);
        return;
      }
      Animated.timing(settle, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [settle]);

  const scale = settle.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Screen tone="forest" className="justify-between">
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center gap-8">
        <Animated.View style={{ opacity: settle, transform: [{ scale }] }}>
          <Mark size={88} />
        </Animated.View>
        <View className="items-center gap-3">
          <Text variant="display" color="cream" className="text-center text-[40px] leading-[46px]">
            Prayer Warriors
          </Text>
          <Text variant="scripture" color="creamSoft" className="max-w-[280px] text-center">
            “For where two or three gather in my name, there am I with them.”
          </Text>
          <Text variant="muted" color="creamFaint">
            Matthew 18:20
          </Text>
        </View>
      </View>
      <View className="gap-4">
        <Button title="Sign in" variant="inverse" onPress={() => router.push('/(auth)/login')} />
        <Text variant="muted" color="creamFaint" className="text-center">
          Membership is by invitation from your group admin.
        </Text>
      </View>
    </Screen>
  );
}
