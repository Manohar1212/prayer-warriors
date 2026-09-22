import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';

import { CATEGORIES, NightOrderCard, PointTitle, PrayerNightCard, useNightOrder, usePrayerNight, usePrayerPoints, usePrayerRequests, type AnsweredPrayerPoint, type PrayerCategory, type PrayerNight, type PrayerPoint, type PrayerRequest, type PrayerStatus } from '@/features/prayer';
import { syncPrayerNightReminders } from '@/features/notifications';
import { useMembers } from '@/features/members';
import { useLanguage } from '@/i18n';
import { prayerNightService, prayerPointsService } from '@/lib/parse';
import { timeAgo } from '@/lib/time';
import { useT, type TranslationKey } from '@/i18n';
import { colors } from '@/theme/tokens';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { Badge, Button, Card, Chip, EmptyState, Screen, Segments, TabHeader, Text } from '@/ui';
import { PrayIcon } from '@/ui/PrayIcon';

type Tab = 'active' | 'monthly' | 'answered';

function RequestCard({ request, onPray, onOpen }: { request: PrayerRequest; onPray: () => void; onOpen: () => void }) {
  const { t, locale } = useLanguage();
  const answered = request.status === 'answered';
  return (
    <Card className="gap-3">
      <Pressable accessibilityRole="button" accessibilityLabel={t('prayer.openRequestNamed', { title: request.title })} onPress={onOpen} className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-panel">
            <PrayIcon size={22} color={colors.primary} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="label" className="text-[15px]" numberOfLines={2}>
              {request.title}
            </Text>
            <Text variant="caption">
              {request.authorName} · {timeAgo(request.createdAt, undefined, t, locale)}
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

function PointRow({ point, canEdit, canPick, onClaim, onRelease, onDone, onEdit, onAnswered }: { point: PrayerPoint; canEdit: boolean; canPick: boolean; onClaim: () => void; onRelease: () => void; onDone: () => void; onEdit: () => void; onAnswered: () => void }) {
  const t = useT();
  const router = useRouter();
  const done = Boolean(point.claim?.doneAt);
  const taken = Boolean(point.claim) && !point.mine;
  // On narrow phones the title needs the room more than the icon does; a finished point keeps its tick.
  const narrow = useWindowDimensions().width < 360;
  const showDisc = !narrow || done;
  return (
    <Card className="gap-3">
      {/* Top-aligned: a point that names people runs several lines, and the icon stays by its title. */}
      <View className="flex-row items-start gap-3">
        {showDisc ? (
          <View className={`h-10 w-10 items-center justify-center rounded-full ${done ? 'bg-sage' : point.mine ? 'bg-sky' : 'bg-panel'}`}>
            {done ? <Ionicons name="checkmark" size={19} color={colors.leaf} /> : <PrayIcon size={20} color={point.mine ? colors.skyDeep : colors.primary} />}
          </View>
        ) : null}
        <View className="flex-1 gap-0.5 pt-1.5">
          <PointTitle title={point.title} />
          {/* Who carries it, only once someone does; an open point needs no empty line. */}
          {point.claim ? (
            <Text variant="caption">
              {done
                ? point.mine
                  ? t('prayer.points.done')
                  : t('prayer.points.doneBy', { name: point.claim.userName })
                : point.mine
                  ? t('prayer.points.yourPick')
                  : t('prayer.points.takenBy', { name: point.claim.userName })}
            </Text>
          ) : null}
        </View>
        {/* Pick sits beside the title, so an open point is one compact row, not a row plus a button. */}
        {!point.claim && canPick ? <Button title={t('prayer.points.pick')} size="compact" variant="secondary" onPress={onClaim} /> : null}
        {point.mine && !done ? <Badge label={t('prayer.points.yours')} tone="sage" /> : null}
        {canEdit ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('prayer.points.editTitle')} onPress={onEdit} hitSlop={8} className="p-1 pt-2">
            <Ionicons name="create-outline" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
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
      {point.requestId ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/prayer/[id]', params: { id: point.requestId } })} hitSlop={8} className="flex-row items-center gap-1 self-start py-0.5">
          <Ionicons name="open-outline" size={13} color={colors.muted} />
          <Text variant="caption">{t('prayer.points.openRequest')}</Text>
        </Pressable>
      ) : null}
      {done && (point.mine || canEdit) ? (
        // A plain question, not green: "Done" is tonight's prayer; answered is a separate step.
        <Pressable accessibilityRole="button" onPress={onAnswered} hitSlop={8} className="flex-row items-center gap-1.5 self-start py-0.5 active:opacity-60">
          <Ionicons name="checkmark-done-outline" size={15} color={colors.muted} />
          <Text variant="label" color="muted" className="text-[13px]">
            {t('prayer.points.askAnswered')}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

/** A point in reorder mode: its title and two arrows, nothing to tap by accident. */
function ReorderRow({ title, first, last, onUp, onDown }: { title: string; first: boolean; last: boolean; onUp: () => void; onDown: () => void }) {
  const t = useT();
  const arrow = (icon: 'arrow-up' | 'arrow-down', disabled: boolean, onPress: () => void, label: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} hitSlop={6} className={`h-10 w-10 items-center justify-center rounded-full bg-panel ${disabled ? 'opacity-30' : 'active:opacity-60'}`}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
  return (
    <Card className="flex-row items-center gap-3 py-3">
      <View className="flex-1">
        <PointTitle title={title} />
      </View>
      {arrow('arrow-up', first, onUp, t('prayer.points.moveUp'))}
      {arrow('arrow-down', last, onDown, t('prayer.points.moveDown'))}
    </Card>
  );
}

function MonthlyPoints() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { isAdmin } = useMembers();
  const { points, loading, error, claim: claimPoint, release: releasePoint, markDone: markPointDone, reorder } = usePrayerPoints(prayerPointsService);
  // One action at a time: while a Pick, Release or Done is on its way, the buttons wait.
  const [busy, setBusy] = useState(false);
  const once = (work: (id: string) => Promise<void>) => async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await work(id);
    } finally {
      setBusy(false);
    }
  };
  const claim = once(claimPoint);
  const release = once(releasePoint);
  const markDone = once(markPointDone);
  // Admin reorder mode: arrows move points in a local draft; Done saves it for everyone.
  const [draft, setDraft] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const byId = new Map(points.map((p) => [p.id, p]));
  // If the list changes while arranging (another admin adds or removes a point), keep the draft
  // in step: drop points that are gone, add new ones at the end. Otherwise Done would be refused.
  useEffect(() => {
    setDraft((current) => {
      if (!current) return current;
      const present = new Set(points.map((p) => p.id));
      const kept = current.filter((id) => present.has(id));
      const added = points.map((p) => p.id).filter((id) => !kept.includes(id));
      return added.length || kept.length !== current.length ? [...kept, ...added] : current;
    });
  }, [points]);
  const shown = draft ? draft.map((id) => byId.get(id)).filter((p): p is PrayerPoint => Boolean(p)) : points;
  const move = (index: number, delta: number) =>
    setDraft((current) => {
      if (!current) return current;
      const next = [...current];
      const to = index + delta;
      if (to < 0 || to >= next.length) return current;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  async function finishReorder() {
    if (!draft) return;
    const changed = draft.some((id, i) => points[i]?.id !== id);
    setSaving(true);
    if (changed) await reorder(draft);
    setSaving(false);
    setDraft(null);
  }
  // One at a time: while you are praying a point (picked, not Done), the other Pick buttons wait.
  const praying = points.some((p) => p.mine && !p.claim?.doneAt);
  const monthName = new Date().toLocaleDateString(locale, { month: 'long' });
  const onNight = useCallback(
    (night: PrayerNight | null) =>
      syncPrayerNightReminders(night, {
        daysAway: (n) => t('prayer.night.reminder.days', { n }),
        tonight: t('prayer.night.reminder.tonight'),
        soon: t('prayer.night.reminder.soon'),
        body: t('prayer.night.reminder.body'),
      }),
    [t],
  );
  const { night } = usePrayerNight(prayerNightService, onNight);
  const { items: order } = useNightOrder(prayerNightService);
  return (
    <View className="gap-3">
      <PrayerNightCard night={night} isAdmin={isAdmin} />
      <NightOrderCard items={order} isAdmin={isAdmin} />
      {/* The heading gets its own line and the admin buttons sit under it, so neither is ever
          pushed off a narrow screen (native text will not wrap beside fixed-width buttons). */}
      <View className="gap-2 pt-1">
        <Text variant="title" className="text-[17px]">
          {t('prayer.points.heading', { month: monthName })}
        </Text>
        {isAdmin ? (
          <View className="flex-row flex-wrap justify-end gap-2">
            {draft ? (
              <Button title={t('common.done')} size="compact" onPress={finishReorder} loading={saving} />
            ) : (
              <>
                {points.length > 1 ? <Button title={t('prayer.points.reorder')} size="compact" variant="secondary" icon="swap-vertical" onPress={() => setDraft(points.map((p) => p.id))} /> : null}
                <Button title={t('prayer.points.add')} size="compact" variant="secondary" icon="add" onPress={() => router.push('/prayer/point')} />
              </>
            )}
          </View>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
      {loading && !points.length ? (
        <ActivityIndicator color={colors.primary} className="mt-6" />
      ) : draft ? (
        shown.map((p, i) => <ReorderRow key={p.id} title={p.title} first={i === 0} last={i === shown.length - 1} onUp={() => move(i, -1)} onDown={() => move(i, 1)} />)
      ) : points.length ? (
        points.map((p) => (
          <PointRow key={p.id} point={p} canEdit={isAdmin} canPick={!praying && !busy} onClaim={() => claim(p.id)} onRelease={() => release(p.id)} onDone={() => markDone(p.id)} onEdit={() => router.push({ pathname: '/prayer/point', params: { id: p.id, title: p.title } })} onAnswered={() => router.push({ pathname: '/prayer/answered', params: { id: p.id, title: p.title } })} />
        ))
      ) : (
        <EmptyState icon="calendar-outline" tone="honey" title={t('prayer.points.empty')} body={isAdmin ? t('prayer.points.emptyAdmin') : t('prayer.points.emptyMember')} />
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
  // Focus covers the first visit too; a separate mount effect only fetched it twice.
  useFocusEffect(load);
  if (!items.length) return null;
  return (
    <View className="gap-2 pb-2">
      <Text variant="title" className="text-[17px]">
        {t('prayer.points.answeredHeading')}
      </Text>
      <Card className="py-1">
        {items.map((p, i) => (
          <View key={p.id} className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-sage">
              <Ionicons name="sparkles" size={16} color={colors.leaf} />
            </View>
            <View className="flex-1 gap-0.5">
              <PointTitle title={p.title} />
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
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(initialTab === 'monthly' || initialTab === 'answered' ? initialTab : 'active');
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
