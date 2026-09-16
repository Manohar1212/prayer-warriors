import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useBibleLanguage } from '@/features/bible';
import { isJoinable, useCalls } from '@/features/calls';
import { useVerseOfTheDay } from '@/features/home/useVerseOfTheDay';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { useLanguage, type TranslationKey } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Card, Screen, Text } from '@/ui';
import { Scene } from '@/ui/Scene';

type IconName = keyof typeof Ionicons.glyphMap;

function greetingKey(date: Date): TranslationKey {
  const h = date.getHours();
  if (h < 12) return 'home.morning';
  if (h < 17) return 'home.afternoon';
  return 'home.evening';
}

const tiles: { label: TranslationKey; icon: IconName; bg: string; fg: string; href: Href }[] = [
  { label: 'tab.prayer', icon: 'hand-left', bg: 'bg-sage', fg: colors.leaf, href: '/(tabs)/prayer' },
  { label: 'tab.community', icon: 'people', bg: 'bg-sky', fg: colors.skyDeep, href: '/(tabs)/community' },
  { label: 'tab.resources', icon: 'layers', bg: 'bg-lavender', fg: colors.violet, href: '/(tabs)/resources' },
  { label: 'tab.funds', icon: 'heart', bg: 'bg-blush', fg: colors.roseDeep, href: '/(tabs)/funds' },
];

function ActionCard({ icon, bg, fg, title, body, onPress }: { icon: IconName; bg: string; fg: string; title: string; body: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      <Card className="flex-row items-center gap-3.5 p-4">
        <View className={`h-12 w-12 items-center justify-center rounded-full ${bg}`}>
          <Ionicons name={icon} size={22} color={fg} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="label" className="text-[15px]">
            {title}
          </Text>
          <Text variant="caption">{body}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [lang] = useBibleLanguage();
  const verse = useVerseOfTheDay(lang);
  const { next: nextCall } = useCalls();
  const name = user?.displayName ?? t('home.friend');
  const firstName = name.split(' ')[0];
  const now = new Date();

  return (
    <Screen edges={['top']} scroll className="gap-4 px-5 pt-3">
      <View className="flex-row items-center justify-between">
        <View>
          <Text variant="body" color="muted">
            {t(greetingKey(now))},
          </Text>
          <Text variant="display" className="text-[26px] leading-[32px]" numberOfLines={1}>
            {firstName}
          </Text>
        </View>
        <HeaderActions />
      </View>

      {/* Today's promise on the sunrise. */}
      <Pressable accessibilityRole="button" accessibilityLabel={t('home.dailyPromise')} onPress={() => router.push('/promise')} className="overflow-hidden rounded-[16px] active:opacity-90" style={{ height: 176 }}>
        <Scene dim style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View className="flex-1 justify-end gap-1 p-5">
          <Text variant="label" color="cream" className={lang === 'te' ? 'text-[17px] leading-[27px]' : 'text-[18px] leading-[26px]'} numberOfLines={3}>
            {verse ? verse.text : '…'}
          </Text>
          {verse ? (
            <Text variant="caption" color="creamSoft">
              {verse.reference}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View className="gap-3">
        <ActionCard icon="hand-left" bg="bg-sky" fg={colors.skyDeep} title={t('home.prayerRequest')} body={t('home.prayerRequestBody')} onPress={() => router.push('/prayer/new')} />
        <ActionCard icon="book" bg="bg-lavender" fg={colors.violet} title={t('home.dailyPromise')} body={t('home.dailyPromiseBody')} onPress={() => router.push('/promise')} />
      </View>

      <View className="flex-row justify-between">
        {tiles.map((tile) => (
          <Pressable key={tile.label} accessibilityRole="button" onPress={() => router.push(tile.href)} className="items-center gap-2 active:opacity-80">
            <View className={`h-[68px] w-[68px] items-center justify-center rounded-[16px] ${tile.bg}`}>
              <Ionicons name={tile.icon} size={26} color={tile.fg} />
            </View>
            <Text variant="caption" color="ink">
              {t(tile.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      {nextCall ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/calls/[id]', params: { id: nextCall.id } })} className="active:opacity-80">
          <Card className="flex-row items-center gap-3.5 p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-sage">
              <Ionicons name="call" size={20} color={colors.leaf} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="label" className="text-[15px]" numberOfLines={1}>
                {nextCall.title}
              </Text>
              <Text variant="caption">{new Date(nextCall.scheduledAt).toLocaleString(locale, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}</Text>
            </View>
            <View className="rounded-full bg-primary px-3.5 py-1.5">
              <Text variant="label" color="cream" className="text-[12px]">
                {isJoinable(nextCall, now) ? t('home.join') : t('home.view')}
              </Text>
            </View>
          </Card>
        </Pressable>
      ) : null}
    </Screen>
  );
}
