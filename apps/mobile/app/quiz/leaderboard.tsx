import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { useLeaderboard, type LeaderboardEntry } from '@/features/quiz';
import { useT } from '@/i18n';
import { quizService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Avatar, Button, Card, EmptyState, Screen, Text } from '@/ui';

const medal = ['bg-honey', 'bg-panel', 'bg-blush'];
const medalInk = [colors.gold, colors.muted, colors.roseDeep];

function Row({ entry, youLabel, daysLabel, todayLabel }: { entry: LeaderboardEntry; youLabel: string; daysLabel: string; todayLabel: string | null }) {
  const top = entry.rank <= 3;
  return (
    <View className={`flex-row items-center gap-3 px-4 py-3 ${entry.me ? 'bg-sky' : ''}`}>
      <View className={`h-8 w-8 items-center justify-center rounded-full ${top ? medal[entry.rank - 1] : ''}`}>
        {top ? <Ionicons name="trophy" size={15} color={medalInk[entry.rank - 1]} /> : (
          <Text variant="label" color="muted">
            {entry.rank}
          </Text>
        )}
      </View>
      <Avatar name={entry.userName} size={36} />
      <View className="flex-1">
        <Text variant="label" className="text-[15px]" numberOfLines={1}>
          {entry.userName}
          {entry.me ? ` · ${youLabel}` : ''}
        </Text>
        <Text variant="caption">
          {daysLabel}
          {todayLabel ? ` · ${todayLabel}` : ''}
        </Text>
      </View>
      <Text variant="display" color="primary" className="text-[22px] leading-[28px]">
        {entry.total}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const t = useT();
  const { entries, error, refresh } = useLeaderboard(quizService);

  return (
    <Screen edges={['bottom']} scroll className="gap-4 pt-4">
      <Text variant="muted">{t('quiz.leaderboardIntro')}</Text>
      {error ? (
        <View className="items-center gap-3">
          <Text variant="body" color="muted" className="text-center">
            {error}
          </Text>
          <Button title={t('common.retry')} variant="secondary" onPress={refresh} />
        </View>
      ) : entries && entries.length === 0 ? (
        <EmptyState icon="trophy-outline" tone="honey" title={t('quiz.emptyTitle')} body={t('quiz.emptyBody')} />
      ) : entries ? (
        <Card className="overflow-hidden" style={{ padding: 0 }}>
          {entries.map((entry, i) => (
            <View key={entry.userId} className={i > 0 ? 'border-t border-border' : ''}>
              <Row entry={entry} youLabel={t('common.you')} daysLabel={entry.days === 1 ? t('quiz.dayPlayed') : t('quiz.daysPlayed', { n: entry.days })} todayLabel={entry.today === null ? null : t('quiz.todayScore', { n: entry.today })} />
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
