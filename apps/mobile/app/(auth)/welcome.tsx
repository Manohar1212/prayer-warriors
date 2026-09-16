import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { gradients } from '@/theme/tokens';
import { Button, Text } from '@/ui';
import { Glow } from '@/ui/Glow';

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
    <View style={{ flex: 1, backgroundColor: gradients.welcome[0] }}>
      <StatusBar style="light" />
      <LinearGradient colors={[...gradients.welcome]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View className="flex-1 justify-between px-6 pb-6 pt-4">
          <View className="flex-1 items-center justify-center gap-8">
            <Animated.View style={{ opacity: settle, transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}>
              <Glow size={520} strength={0.42} />
              <Image source={logo} accessibilityLabel="Prayer Warriors" style={{ width: 280, height: 280 }} resizeMode="contain" />
            </Animated.View>
            <Text variant="body" color="creamSoft" className="max-w-[260px] text-center text-[15px] leading-[22px]">
              {t('welcome.tagline')}
            </Text>
            <View className="items-center gap-2">
              <Text variant="scripture" color="creamSoft" className="max-w-[280px] text-center text-[16px] leading-[25px]">
                {t('welcome.verse')}
              </Text>
              <Text variant="caption" color="creamFaint">
                {t('welcome.verseRef')}
              </Text>
            </View>
          </View>
          <View className="gap-4">
            <Button title={t('welcome.signIn')} variant="inverse" onPress={() => router.push('/(auth)/login')} />
            <Text variant="caption" color="creamFaint" className="text-center">
              {t('welcome.invitation')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
