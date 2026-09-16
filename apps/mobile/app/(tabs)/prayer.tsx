import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { CATEGORIES, usePrayerPoints, usePrayerRequests, type AnsweredPrayerPoint, type PrayerCategory, type PrayerPoint, type PrayerRequest, type PrayerStatus } from '@/features/prayer';
import { useMembers } from '@/features/members';
import { useLanguage } from '@/i18n';
import { prayerPointsService } from '@/lib/parse';
import { timeAgoShort } from '@/lib/time';
import { useT, type TranslationKey } from '@/i18n';
import { colors } from '@/theme/tokens';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { Badge, Button, Card, Chip, EmptyState, Screen, Segments, TabHeader, Text } from '@/ui';

type Tab = 'active' | 'monthly' | 'answered';

function RequestCard({ request, onPray, onOpen }: { request: PrayerRequest; onPray: () => void; onOpen: () => void }) {
  const t = useT();
  const answered = request.status === 'answered';
  return (
    <Card className="gap-3">
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${request.title}`} onPress={onOpen} className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-honey">
            <Ionicons name="hand-left" size={20} color={colors.gold} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="label" className="text-[15px]" numberOfLines={2}>
              {request.title}
            </Text>
            <Text variant="caption">
              {request.authorName} · {timeAgoShort(request.createdAt)}
            </Text>
          </View>
          {request.urgency === 'urgent' && !answered ? <Badge label={t('prayer.urgent')} tone="blush" /> : null}
          {answered ? <Badge label={t('prayer.answered')} tone="sage" /> : null}
        </View>
        {request.description ? (
          <Text variant="muted" className="text-[14px] leading-[21px]" numberOfLines={2}>
            {request.description}
          </Text>
        ) : null}
        {answered && request.testimony ? (
          <Text variant="scripture" className="text-[15px] leading-[23px]" numberOfLines={2}>
            {request.testimony}
          </Text>
        ) : null}
      </Pressable>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name={request.praying ? 'heart' : 'heart-outline'} size={16} color={colors.roseDeep} />
          <Text variant="caption">{request.prayingCount} {t('common.praying')}</Text>
        </View>
        {answered ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={request.praying ? t('prayer.stopPraying') : t('prayer.imPraying')}
            onPress={onPray}
            hitSlop={8}
            className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${request.praying ? 'bg-primary' : 'bg-lavender'}`}
          >
            {request.praying ? <Ionicons name="checkmark" size={14} color={colors.surface} /> : null}
            <Text variant="label" color={request.praying ? 'cream' : 'primary'} className="text-[13px]">
              {request.praying ? t('prayer.prayingNow') : t('prayer.imPraying')}
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

function PointRow({ point, canEdit, onClaim, onRelease, onDone, onEdit, onAnswered }: { point: PrayerPoint; canEdit: boolean; onClaim: () => void; onRelease: () => void; onDone: () => void; onEdit: () => void; onAnswered: () => void }) {
  const t = useT();
  const done = Boolean(point.claim?.doneAt);
  const taken = Boolean(point.claim) && !point.mine;
  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className={`h-11 w-11 items-center justify-center rounded-full ${done ? 'bg-sage' : point.mine ? 'bg-sky' : 'bg-honey'}`}>
          <Ionicons name={done ? 'checkmark' : 'hand-left'} size={20} color={done ? colors.leaf : point.mine ? colors.skyDeep : colors.gold} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="label" className="text-[15px]">
            {point.title}
          </Text>
          <Text variant="caption">
            {point.claim
              ? done
                ? point.mine
                  ? t('prayer.points.done')
                  : t('prayer.points.doneBy', { name: point.claim.userName })
                : point.mine
                  ? t('prayer.points.yourPick')
                  : t('prayer.points.takenBy', { name: point.claim.userName })
              : ' '}
          </Text>
        </View>
        {point.mine && !done ? <Badge label={t('prayer.points.yours')} tone="sage" /> : null}
        {canEdit ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('prayer.points.editTitle')} onPress={onEdit} hitSlop={8} className="p-1">
            <Ionicons name="create-outline" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {!point.claim ? <Button title={t('prayer.points.pick')} size="compact" variant="secondary" onPress={onClaim} className="self-end" /> : null}
      {point.mine && !done ? (
        <View className="flex-row items-center justify-end gap-3">
          <Pressable accessibilityRole="button" onPress={onRelease} hitSlop={8} className="py-1">
            <Text variant="label" color="muted" className="text-[13px]">
              {t('prayer.points.release')}
            </Text>
          </Pressable>
          <Button title={t('prayer.points.markDone')} size="compact" icon="checkmark" onPress={onDone} />
        </View>
      ) : null}
      {point.mine || canEdit ? (
        <Pressable accessibilityRole="button" onPress={onAnswered} hitSlop={8} className="flex-row items-center gap-1.5 self-start py-0.5">
          <Ionicons name="sparkles-outline" size={14} color={colors.leaf} />
          <Text variant="label" color="leaf" className="text-[13px]">
            {t('prayer.points.markAnswered')}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function MonthlyPoints() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { isAdmin } = useMembers();
  const { points, loading, error, claim, release, markDone } = usePrayerPoints(prayerPointsService);
  const monthName = new Date().toLocaleDateString(locale, { month: 'long' });
  return (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <Text variant="muted" className="flex-1 text-[13px] leading-[19px]">
          {t('prayer.points.intro', { month: monthName })}
        </Text>
        {isAdmin ? <Button title={t('prayer.points.add')} size="compact" variant="secondary" icon="add" onPress={() => router.push('/prayer/point')} /> : null}
      </View>
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
      {loading && !points.length ? (
        <ActivityIndicator color={colors.primary} className="mt-6" />
      ) : points.length ? (
        points.map((p) => (
          <PointRow key={p.id} point={p} canEdit={isAdmin} onClaim={() => claim(p.id)} onRelease={() => release(p.id)} onDone={() => markDone(p.id)} onEdit={() => router.push({ pathname: '/prayer/point', params: { id: p.id, title: p.title } })} onAnswered={() => router.push({ pathname: '/prayer/answered', params: { id: p.id, title: p.title } })} />
        ))
      ) : (
        <EmptyState icon="calendar-outline" tone="honey" title={t('prayer.points.empty')} body={isAdmin ? t('prayer.points.emptyAdmin') : ''} />
      )}
    </View>
  );
}

function AnsweredPoints() {
  const { t, locale } = useLanguage();
  const [items, setItems] = useState<AnsweredPrayerPoint[]>([]);
  const load = useCallback(() => {
    prayerPointsService.listAnswered().then(setItems).catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);
  useFocusEffect(load);
  if (!items.length) return null;
  return (
    <View className="gap-2 pb-2">
      <Text variant="title" className="text-[16px]">
        {t('prayer.points.answeredHeading')}
      </Text>
      <Card className="py-1">
        {items.map((p, i) => (
          <View key={p.id} className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-sage">
              <Ionicons name="sparkles" size={16} color={colors.leaf} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="label" className="text-[15px]">
                {p.title}
              </Text>
              <Text variant="caption">{t('prayer.points.answeredOn', { date: new Date(p.answeredAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) })}</Text>
              {p.testimony ? (
                <Text variant="scripture" className="text-[14px] leading-[21px]">
                  {p.testimony}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

export default function PrayerScreen() {
  const router = useRouter();
  const t = useT();
  const [tab, setTab] = useState<Tab>('active');
  const status: PrayerStatus = tab === 'answered' ? 'answered' : 'active';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PrayerCategory | 'all'>('all');
  const { requests, loading, error, refresh, togglePraying } = usePrayerRequests(status);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => (category === 'all' || r.category === category) && (!q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)));
  }, [requests, query, category]);


  return (
    <Screen edges={['top']} backdrop className="px-0 pt-0 pb-0">
      <FlatList
        data={tab === 'monthly' ? [] : visible}
        keyExtractor={(r) => r.id}
        contentContainerClassName="flex-grow gap-3 px-4 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <TabHeader title={t('prayer.title')} subtitle={status === 'active' ? (requests.length === 1 ? t('prayer.openRequest') : t('prayer.openRequests', { count: requests.length })) : t('prayer.answeredCount', { count: requests.length })} right={<HeaderActions />} />
            <Segments<Tab>
              options={[
                { value: 'active', label: t('prayer.requestsTab') },
                { value: 'monthly', label: t('prayer.monthly') },
                { value: 'answered', label: t('prayer.answered') },
              ]}
              value={tab}
              onChange={setTab}
            />
            {tab === 'monthly' ? <MonthlyPoints /> : null}
            {tab === 'answered' ? <AnsweredPoints /> : null}
            {tab === 'monthly' ? null : (
            <>
            <View className="flex-row items-center gap-2 rounded-[12px] border border-border bg-surface px-3.5">
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                placeholder={t('prayer.searchPlaceholder')}
                placeholderTextColor={colors.muted}
                selectionColor={colors.primary}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                className="min-h-[40px] flex-1 font-sans text-[15px] text-ink"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              <Chip label={t('prayer.all')} selected={category === 'all'} onPress={() => setCategory('all')} />
              {CATEGORIES.map((c) => (
                <Chip key={c.id} label={t(`prayer.category.${c.id}` as TranslationKey)} selected={category === c.id} onPress={() => setCategory(c.id)} />
              ))}
            </ScrollView>
            </>
            )}
            {error ? (
              <Text variant="caption" color="roseDeep">
                {error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          tab === 'monthly' ? null : loading ? (
            <ActivityIndicator color={colors.primary} className="mt-10" />
          ) : (
            <EmptyState
              icon={status === 'active' ? 'heart-outline' : 'sparkles-outline'}
              tone={status === 'active' ? 'blush' : 'honey'}
              title={status === 'active' ? t('prayer.emptyActiveTitle') : t('prayer.emptyAnsweredTitle')}
              body={status === 'active' ? t('prayer.emptyActiveBody') : t('prayer.emptyAnsweredBody')}
            />
          )
        }
        renderItem={({ item }) => (
          <RequestCard request={item} onPray={() => togglePraying(item.id)} onOpen={() => router.push({ pathname: '/prayer/[id]', params: { id: item.id } })} />
        )}
      />
      {tab === 'monthly' ? null : (
        <View className="border-t border-border bg-surface px-4 pb-3 pt-3">
          <Button title={t('prayer.newRequest')} icon="add" onPress={() => router.push('/prayer/new')} />
        </View>
      )}
    </Screen>
  );
}
