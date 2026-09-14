import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Switch, TextInput, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useMembers } from '@/features/members';
import { usePrayerRequests, type PrayerComment } from '@/features/prayer';
import { prayerService } from '@/lib/parse';
import { timeAgo } from '@/lib/time';
import { useLanguage, type TranslationKey } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Avatar, AvatarStack, Badge, Button, Card, Input, Screen, Text } from '@/ui';

function longDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PrayerRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { isAdmin } = useMembers();
  const active = usePrayerRequests('active');
  const answered = usePrayerRequests('answered');
  const request = [...active.requests, ...answered.requests].find((r) => r.id === id) ?? null;
  const [names, setNames] = useState<string[]>([]);
  const [comments, setComments] = useState<PrayerComment[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [testimony, setTestimony] = useState('');
  const [answering, setAnswering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(() => {
    if (!id) return;
    prayerService.comments(id).then(setComments).catch(() => setComments([]));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    prayerService.prayingMembers(id).then(setNames).catch(() => setNames([]));
  }, [id, request?.prayingCount]);
  useEffect(loadComments, [loadComments]);

  if (!request) {
    return (
      <Screen edges={['bottom']} className="justify-center">
        <Text variant="muted">{active.loading || answered.loading ? t('common.loading') : t('prayer.detail.notAvailable')}</Text>
      </Screen>
    );
  }

  const isAnswered = request.status === 'answered';
  const canAnswer = !isAnswered && (request.authorId === user?.id || isAdmin);

  async function submitAnswered() {
    if (!request) return;
    setBusy(true);
    setError(null);
    try {
      await active.markAnswered(request.id, testimony);
      await answered.refresh();
      setAnswering(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prayer.detail.updateFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function sendComment() {
    if (!request || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const created = await prayerService.addComment(request.id, draft);
      setComments((c) => [...c, created]);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prayer.detail.commentFailed'));
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-5 pt-5">
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          <Badge label={t(`prayer.category.${request.category}` as TranslationKey)} tone="honey" />
          {request.urgency === 'urgent' && !isAnswered ? <Badge label={t('prayer.urgent')} tone="blush" /> : null}
          {isAnswered ? <Badge label={t('prayer.answered')} tone="sage" /> : null}
        </View>
        <Text variant="display" color="primaryDark" className="text-[28px] leading-[34px]">
          {request.title}
        </Text>
        <View className="flex-row items-center gap-2">
          <Avatar name={request.authorName} size={24} />
          <Text variant="caption">
            {request.authorName} · {longDate(request.createdAt, locale)}
          </Text>
        </View>
      </View>

      {request.description ? <Text className="text-[16px] leading-[26px]">{request.description}</Text> : null}

      {isAnswered ? (
        <Card tone="honey" className="gap-2">
          <Text variant="label" color="gold" className="text-[13px]">
            {t('prayer.detail.answeredOn', { date: request.answeredAt ? longDate(request.answeredAt, locale) : '' })}
          </Text>
          {request.testimony ? <Text variant="scripture" className="text-[18px] leading-[28px]">{request.testimony}</Text> : null}
        </Card>
      ) : (
        <Button
          title={request.praying ? t('prayer.detail.youArePraying') : t('prayer.imPraying')}
          icon={request.praying ? 'checkmark' : 'hand-left'}
          variant={request.praying ? 'secondary' : 'primary'}
          onPress={() => active.togglePraying(request.id)}
        />
      )}

      <View className="gap-3">
        <Text variant="title" className="text-[20px]">
          {request.prayingCount === 0 ? t('prayer.detail.noOnePraying') : request.prayingCount === 1 ? t('prayer.detail.onePraying') : t('prayer.detail.manyPraying', { count: request.prayingCount })}
        </Text>
        {names.length ? <AvatarStack names={names} size={36} max={5} /> : null}
      </View>

      {canAnswer ? (
        <Card className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-0.5">
              <Text variant="label" className="text-[15px]">
                {t('prayer.detail.markAnswered')}
              </Text>
              <Text variant="caption">{t('prayer.detail.markAnsweredHint')}</Text>
            </View>
            <Switch
              accessibilityLabel={t('prayer.detail.markAnswered')}
              value={answering}
              onValueChange={setAnswering}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.surface}
            />
          </View>
          {answering ? (
            <View className="gap-3">
              <Input label={t('prayer.detail.testimony')} value={testimony} onChangeText={setTestimony} maxLength={1000} multiline />
              <Button title={t('prayer.detail.markAnswered')} onPress={submitAnswered} loading={busy} />
            </View>
          ) : null}
        </Card>
      ) : null}

      <View className="gap-3">
        <Text variant="title" className="text-[20px]">
          {t('prayer.detail.comments')}
        </Text>
        {comments.length ? (
          <Card className="py-1">
            {comments.map((c, i) => (
              <View key={c.id} className={`flex-row gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                <Avatar name={c.authorName} size={32} />
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text variant="label" className="text-[14px]">
                      {c.authorName}
                    </Text>
                    <Text variant="caption" className="text-[12px]">
                      {timeAgo(c.createdAt, undefined, t)}
                    </Text>
                  </View>
                  <Text className="text-[15px] leading-[22px]">{c.body}</Text>
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <Text variant="caption">{t('prayer.detail.firstComment')}</Text>
        )}
        <View className="flex-row items-center gap-2 rounded-full bg-surface py-1 pl-4 pr-1">
          <TextInput
            placeholder={t('prayer.detail.addComment')}
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            value={draft}
            onChangeText={setDraft}
            maxLength={500}
            className="min-h-[40px] flex-1 font-sans text-[15px] text-ink"
            onSubmitEditing={sendComment}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('prayer.detail.sendComment')}
            onPress={sendComment}
            disabled={sending || !draft.trim()}
            className={`h-10 w-10 items-center justify-center rounded-full ${draft.trim() ? 'bg-primary' : 'bg-lavender'}`}
          >
            <Ionicons name="arrow-forward" size={18} color={draft.trim() ? colors.surface : colors.primary} />
          </Pressable>
        </View>
        {error ? (
          <Text variant="caption" color="roseDeep">
            {error}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
