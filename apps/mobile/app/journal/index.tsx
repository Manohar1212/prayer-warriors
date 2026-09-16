import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { categoryLabel, useJournal, type JournalEntry } from '@/features/prayer';
import { useLanguage, type TranslationKey } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Meta, Screen, Text } from '@/ui';

function shortDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function EntryCard({ entry, onOpen }: { entry: JournalEntry; onOpen: () => void }) {
  const { t, locale } = useLanguage();
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} className="gap-2 border-b border-border py-4">
      <View className="flex-row items-center justify-between">
        <Meta parts={entry.answered ? [{ text: t(`prayer.category.${entry.category}` as TranslationKey), dot: 'gold' }, { text: t('journal.entry.answered'), color: 'gold' }] : [{ text: t(`prayer.category.${entry.category}` as TranslationKey), dot: 'sage' }]} />
        <Text variant="caption">{shortDate(entry.answered && entry.answeredAt ? entry.answeredAt : entry.createdAt, locale)}</Text>
      </View>
      <Text variant="title" className="text-[17px] leading-[23px]">
        {entry.title}
      </Text>
      {entry.body ? (
        <Text variant="muted" className="text-[15px] leading-[22px]" numberOfLines={2}>
          {entry.body}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function JournalScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { active, answered, loading, error } = useJournal();

  return (
    <Screen edges={['bottom']} backdrop className="px-0 pt-0">
      <ScrollView contentContainerClassName="gap-6 px-4 pb-8 pt-2" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text variant="muted" className="text-[15px] leading-[22px]">
            {t('journal.intro')}
          </Text>
          <Button title={t('journal.newEntry')} onPress={() => router.push('/journal/entry')} />
          {error ? (
            <Text variant="muted" color="rose">
              {error}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} className="mt-6" />
        ) : active.length === 0 && answered.length === 0 ? (
          <View className="gap-1">
            <Text variant="title">{t('journal.emptyTitle')}</Text>
            <Text variant="muted" className="max-w-[300px] text-[15px] leading-[22px]">
              {t('journal.emptyBody')}
            </Text>
          </View>
        ) : (
          <>
            {active.length ? (
              <View className="gap-3">
                <Text variant="title">{t('journal.prayingFor')}</Text>
                {active.map((e) => (
                  <EntryCard key={e.id} entry={e} onOpen={() => router.push({ pathname: '/journal/entry', params: { id: e.id } })} />
                ))}
              </View>
            ) : null}
            {answered.length ? (
              <View className="gap-3">
                <Text variant="title">{t('journal.answered')}</Text>
                {answered.map((e) => (
                  <EntryCard key={e.id} entry={e} onOpen={() => router.push({ pathname: '/journal/entry', params: { id: e.id } })} />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
