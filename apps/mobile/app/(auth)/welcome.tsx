import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Text } from '@/ui';
import { CrossMark } from '@/ui/CrossMark';
import { Scene } from '@/ui/Scene';

/** Two full-screen pages over the sunrise: the name and the verse, then the invitation. */
export default function WelcomeScreen() {
  const router = useRouter();
  const t = useT();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: '#1E2D42' }}>
      <StatusBar style="light" />
      <Scene variant="cross" shape="tall" dim style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flex: 1 }}
        >
          <View style={{ width }} className="flex-1 items-center justify-between px-8 pb-6 pt-10">
            <View className="items-center gap-3 pt-6">
              <CrossMark size={56} color={colors.surface} />
              <Text variant="display" color="cream" className="text-[30px] leading-[36px]">
                Prayer Warriors
              </Text>
              <Text variant="caption" color="creamSoft" style={{ letterSpacing: 3 }}>
                PRAY · GROW · SERVE
              </Text>
            </View>
            <View className="items-center gap-2">
              <Text variant="body" color="cream" className="max-w-[280px] text-center text-[16px] leading-[24px]">
                {t('welcome.verse')}
              </Text>
              <Text variant="caption" color="creamSoft">
                {t('welcome.verseRef')}
              </Text>
            </View>
          </View>
          <View style={{ width }} className="flex-1 items-center justify-center px-10">
            <CrossMark size={44} color={colors.surface} />
            <Text variant="title" color="cream" className="mt-5 max-w-[300px] text-center text-[24px] leading-[32px]">
              {t('welcome.tagline')}
            </Text>
            <View className="mt-5 h-[3px] w-10 rounded-full bg-surface/80" />
          </View>
        </ScrollView>
        <View className="items-center gap-5 px-6 pb-2">
          <View className="flex-row gap-2">
            {[0, 1].map((i) => (
              <View key={i} className={`h-1.5 rounded-full ${page === i ? 'w-6 bg-surface' : 'w-1.5 bg-surface/50'}`} />
            ))}
          </View>
          <Button title={t('common.continue')} variant="inverse" onPress={() => router.push('/(auth)/language')} className="w-full" />
        </View>
      </SafeAreaView>
    </View>
  );
}
