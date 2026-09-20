import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { formatDuration, useLeaderboard, type LeaderboardEntry } from '@/features/quiz';
import { useLanguage } from '@/i18n';
import { quizService } from '@/lib/parse';
import { colors, gradients } from '@/theme/tokens';
import { Avatar, Button, Card, EmptyState, Screen, Text } from '@/ui';

const ringColor = ['#F5C24B', '#C9D1DB', '#D9A066'];

function monthLabel(month: string, locale: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

function dayLabel(day: string, locale: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'long' });
}

/** One of the three places on the podium; first place stands taller in the middle. */
function Podium({ entry, place }: { entry: LeaderboardEntry | undefined; place: 1 | 2 | 3 }) {
  const height = place === 1 ? 92 : place === 2 ? 68 : 52;
  const size = place === 1 ? 64 : 52;
  return (
    <View className="flex-1 items-center justify-end gap-2">
      {entry ? (
        <>
          <View className="items-center gap-1">
            <View className="rounded-full p-[3px]" style={{ backgroundColor: ringColor[place - 1] }}>
              <Avatar name={entry.userName} size={size} />
            </View>
            <Text variant="label" color="cream" className="text-[13px]" numberOfLines={1}>
              {entry.userName.split(' ')[0]}
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={13} color={colors.gold} />
              <Text variant="caption" color="creamSoft">
                {entry.points} · {formatDuration(entry.timeMs)}
              </Text>
            </View>
          </View>
        </>
      ) : null}
      <View className="w-full items-center justify-start rounded-t-[12px] pt-2" style={{ height, backgroundColor: place === 1 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.14)' }}>
        <Text variant="display" color="cream" className="text-[22px] leading-[26px]">
          {place}
        </Text>
      </View>
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Ionicons name={icon} size={16} color={colors.skyDeep} />
      <Text variant="display" className="text-[20px] leading-[26px]">
        {value}
      </Text>
      <Text variant="caption" color="muted">
        {label}
      </Text>
    </View>
  );
}

function Row({ entry, daysInMonth, streakText, t }: { entry: LeaderboardEntry; daysInMonth: number; streakText: (n: number) => string; t: (k: 'quiz.pts' | 'quiz.daysOf' | 'quiz.todayScore' | 'common.you', v?: Record<string, string | number>) => string }) {
  const alive = entry.streak > 0;
  return (
    <View className={`flex-row items-center gap-3 px-4 py-3 ${entry.me ? 'bg-sky' : ''}`}>
      <Text variant="label" color="muted" className="w-6 text-center">
        {entry.rank}
      </Text>
      <Avatar name={entry.userName} size={38} />
      <View className="flex-1">
        <Text variant="label" className="text-[15px]" numberOfLines={1}>
          {entry.userName}
          {entry.me ? ` · ${t('common.you')}` : ''}
        </Text>
        <Text variant="caption">
          {t('quiz.pts', { n: entry.points })} · {formatDuration(entry.timeMs)} · {t('quiz.daysOf', { n: entry.days, total: daysInMonth })}
          {entry.today === null ? '' : ` · ${t('quiz.todayScore', { n: entry.today })}`}
        </Text>
      </View>
      <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${alive ? 'bg-honey' : 'bg-panel'}`}>
        <Ionicons name={alive ? 'flame' : 'flame-outline'} size={14} color={alive ? colors.gold : colors.muted} />
        <Text variant="label" color={alive ? 'ink' : 'muted'} className="text-[13px]">
          {streakText(entry.streak)}
        </Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { t, locale } = useLanguage();
  const { board, loading, error, refresh, setMonth } = useLeaderboard(quizService);
  const streakText = (n: number) => (n === 1 ? t('quiz.streakDay') : t('quiz.streakDays', { n }));

  if (!board && loading) {
    return (
      <Screen edges={['bottom']} className="items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }
  if (!board) {
    return (
      <Screen edges={['bottom']} className="items-center justify-center gap-4 px-8">
        <Text variant="body" color="muted" className="text-center">
          {error ?? t('quiz.failed')}
        </Text>
        <Button title={t('common.retry')} variant="secondary" onPress={refresh} />
      </Screen>
    );
  }

  const at = board.months.indexOf(board.month);
  const older = board.months[at + 1];
  const newer = at > 0 ? board.months[at - 1] : undefined;
  const me = board.entries.find((e) => e.me);
  const [first, second, third] = board.entries;

  return (
    <Screen edges={['bottom']} scroll className="gap-4 pt-3">
      {/* Month switcher: the board starts again each month and earlier months stay as history. */}
      <View className="flex-row items-center justify-between">
        <Pressable accessibilityRole="button" accessibilityLabel={t('quiz.olderMonth')} disabled={!older} onPress={() => older && setMonth(older)} className={`h-10 w-10 items-center justify-center rounded-full border border-border bg-surface ${older ? 'active:opacity-70' : 'opacity-30'}`}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </Pressable>
        <View className="items-center">
          <Text variant="title" className="text-[19px]">
            {monthLabel(board.month, locale)}
          </Text>
          <Text variant="caption" color="muted">
            {board.current ? t('quiz.resetsOn', { date: dayLabel(board.resetsOn, locale) }) : t('quiz.history')}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('quiz.newerMonth')} disabled={!newer} onPress={() => newer && setMonth(newer)} className={`h-10 w-10 items-center justify-center rounded-full border border-border bg-surface ${newer ? 'active:opacity-70' : 'opacity-30'}`}>
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
      </View>

      {board.entries.length === 0 ? (
        <EmptyState icon="trophy-outline" tone="honey" title={board.current ? t('quiz.emptyTitle') : t('quiz.emptyPastTitle')} body={board.current ? t('quiz.emptyBody') : t('quiz.emptyPastBody')} />
      ) : (
        <>
          <LinearGradient colors={[...gradients.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 16, paddingHorizontal: 12, paddingTop: 20, overflow: 'hidden', opacity: loading ? 0.6 : 1 }}>
            <View className="flex-row items-end gap-2">
              <Podium entry={second} place={2} />
              <Podium entry={first} place={1} />
              <Podium entry={third} place={3} />
            </View>
          </LinearGradient>

          <Card className="gap-3">
            <Text variant="label" color="muted" className="text-[12px] uppercase tracking-[1px]">
              {t('quiz.yourMonth')}
            </Text>
            {me ? (
              <View className="flex-row">
                <Stat icon="checkmark-circle-outline" label={t('quiz.points')} value={String(me.points)} />
                <Stat icon="timer-outline" label={t('quiz.time')} value={formatDuration(me.timeMs)} />
                <Stat icon="flame" label={t('quiz.streak')} value={String(me.streak)} />
                <Stat icon="ribbon" label={t('quiz.rank')} value={`#${me.rank}`} />
              </View>
            ) : (
              <Text variant="body" color="muted">
                {board.current ? t('quiz.playToday') : t('quiz.notPlayed')}
              </Text>
            )}
          </Card>

          <View className="gap-2">
            <Text variant="label" color="muted" className="px-1 text-[12px] uppercase tracking-[1px]">
              {t('quiz.everyone')}
            </Text>
            <Text variant="caption" color="muted" className="px-1">
              {t('quiz.rankRule')}
            </Text>
            <Card className="overflow-hidden" style={{ padding: 0 }}>
              {board.entries.map((entry, i) => (
                <View key={entry.userId} className={i > 0 ? 'border-t border-border' : ''}>
                  <Row entry={entry} daysInMonth={board.daysInMonth} streakText={streakText} t={t} />
                </View>
              ))}
            </Card>
          </View>
        </>
      )}
    </Screen>
  );
}
