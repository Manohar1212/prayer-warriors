import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { en } from '@/i18n/en';
import { te } from '@/i18n/te';
import { colors, fonts } from '@/theme/tokens';
import { Button, Text } from '@/ui';
import { CrossMark } from '@/ui/CrossMark';

/**
 * The front door: first light over the mountains. The name sits in the open sky, which the
 * photograph already lights, so no wash is needed over it; the verse rests on the dark ridge
 * below, where a soft fade seats the text. Both languages are shown because the group reads
 * both and has not chosen one yet.
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#D9DEE6' }}>
      <StatusBar style="dark" />
      {/* Anchored to the bottom so the ridge, not the empty sky, fills the screen. */}
      <Image
        source={require('../../assets/promise/mountains-tall.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '118%' }}
      />
      {/* The ridge is already dark; this only deepens it so cream text holds at any brightness. */}
      <LinearGradient
        colors={['rgba(12,20,34,0)', 'rgba(12,20,34,0.55)', 'rgba(12,20,34,0.92)']}
        locations={[0.5, 0.74, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View className="items-center gap-3 px-8 pt-12">
          <CrossMark size={40} color={colors.primary} />
          <Text variant="display" className="text-center text-[32px] leading-[38px]" style={{ letterSpacing: -0.4 }}>
            Prayer Warriors
          </Text>
        </View>

        <View className="mt-auto gap-6 px-8 pb-4">
          <View className="gap-3">
            <Text variant="body" color="cream" className="text-center text-[17px] leading-[26px]">
              {en['welcome.verse']}
            </Text>
            <Text color="creamSoft" className="text-center text-[15px] leading-[26px]" style={{ fontFamily: fonts.teluguSans }}>
              {te['welcome.verse']}
            </Text>
            <Text variant="caption" color="creamSoft" className="text-center">
              {en['welcome.verseRef']}
            </Text>
          </View>

          <View className="gap-3">
            <Button title={en['welcome.signIn']} variant="inverse" onPress={() => router.push('/(auth)/login')} />
            <Text variant="caption" color="creamSoft" className="text-center">
              {en['welcome.invitation']}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
