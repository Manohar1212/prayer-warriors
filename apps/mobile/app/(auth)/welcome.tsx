import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { Backdrop, Button, Text } from '@/ui';

const logo = require('../../assets/logo.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const t = useT();
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
    <View style={{ flex: 1, backgroundColor: '#FBE9E1' }}>
      <StatusBar style="dark" />
      <Backdrop />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View className="flex-1 justify-between px-6 pb-6 pt-4">
          <View className="flex-1 items-center justify-center gap-8">
            <Animated.View style={{ opacity: settle, transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}>
              <Image source={logo} accessibilityLabel="Prayer Warriors" style={{ width: 280, height: 280 }} resizeMode="contain" />
            </Animated.View>
            <Text variant="body" color="muted" className="max-w-[260px] text-center text-[15px] leading-[22px]">
              {t('welcome.tagline')}
            </Text>
            <View className="items-center gap-2">
              <Text variant="scripture" className="max-w-[280px] text-center text-[16px] leading-[25px]">
                {t('welcome.verse')}
              </Text>
              <Text variant="caption">
                {t('welcome.verseRef')}
              </Text>
            </View>
          </View>
          <View className="gap-4">
            <Button title={t('welcome.signIn')} onPress={() => router.push('/(auth)/login')} />
            <Text variant="caption" className="text-center">
              {t('welcome.invitation')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
