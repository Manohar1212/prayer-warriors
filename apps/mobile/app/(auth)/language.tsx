import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useLanguage, type Language } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Screen, Text } from '@/ui';

const options: { value: Language; name: string; native: string; letter: string; bg: string; fg: string }[] = [
  { value: 'en', name: 'English', native: 'English', letter: 'A', bg: 'bg-sky', fg: colors.primary },
  { value: 'te', name: 'తెలుగు', native: 'Telugu', letter: 'తె', bg: 'bg-sage', fg: colors.leaf },
];

/** The first choice after Welcome: which language the whole app speaks. */
export default function LanguageScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  return (
    <Screen edges={['top', 'bottom']} className="justify-between px-6 pb-6 pt-16">
      <View className="gap-6">
        <View className="gap-2">
          <Text variant="display" className="text-[26px] leading-[32px]">
            {t('language.title')}
          </Text>
          <Text variant="muted">{t('language.subtitle')}</Text>
        </View>
        <View className="gap-3">
          {options.map((o) => {
            const selected = language === o.value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setLanguage(o.value)}
                className={`flex-row items-center gap-4 rounded-[14px] border bg-surface p-4 ${selected ? 'border-primary' : 'border-border'}`}
              >
                <View className={`h-12 w-12 items-center justify-center rounded-full ${o.bg}`}>
                  <Text variant="label" className="text-[16px]" style={{ color: o.fg }}>
                    {o.letter}
                  </Text>
                </View>
                <View className="flex-1 gap-0.5">
                  <Text variant="label" className="text-[16px]">
                    {o.name}
                  </Text>
                  <Text variant="caption">{o.native}</Text>
                </View>
                <Ionicons name={selected ? 'checkmark-circle' : 'chevron-forward'} size={20} color={selected ? colors.primary : colors.muted} />
              </Pressable>
            );
          })}
        </View>
      </View>
      <Button title={t('common.continue')} onPress={() => router.push('/(auth)/login')} />
    </Screen>
  );
}
