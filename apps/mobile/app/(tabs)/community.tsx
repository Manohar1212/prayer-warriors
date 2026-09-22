import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { callTitle, isJoinable, useCalls } from '@/features/calls';
import { useMembers, type Member } from '@/features/members';
import { callsService } from '@/lib/parse';
import { useLanguage } from '@/i18n';
import { colors } from '@/theme/tokens';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { Avatar, AvatarStack, Button, Card, Screen, Segments, TabHeader, Text } from '@/ui';

type Tab = 'calls' | 'members';

// WhatsApp's green, deepened a little so the logo reads on its pale disc.
const WHATSAPP_GREEN = '#1DA851';
const WHATSAPP_TINT = '#E4F6EA';

/**
 * A round button beside a member: two soft discs of the same weight, blue for a call and
 * pale green with WhatsApp's own logo.
 */
function ContactButton({ kind, label, url }: { kind: 'call' | 'whatsapp'; label: string; url: string }) {
  const call = kind === 'call';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => Linking.openURL(url).catch(() => undefined)}
      hitSlop={4}
      className={`h-10 w-10 items-center justify-center rounded-full active:opacity-70 ${call ? 'bg-sky' : ''}`}
      style={call ? undefined : { backgroundColor: WHATSAPP_TINT }}
    >
      <Ionicons name={call ? 'call' : 'logo-whatsapp'} size={call ? 17 : 19} color={call ? colors.primary : WHATSAPP_GREEN} />
    </Pressable>
  );
}

function MemberRow({ member, isYou, last, canRemove, onRemove }: { member: Member; isYou: boolean; last: boolean; canRemove: boolean; onRemove: (userId: string) => Promise<void> }) {
  const { t } = useLanguage();
  const admin = member.role === 'admin';
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Two taps rather than a system alert: a two-button Alert does nothing on the web build.
  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onRemove(member.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('members.remove.failed'));
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <View className={`gap-2 py-3 ${last ? '' : 'border-b border-border'}`}>
      <View className="flex-row items-center gap-3">
        <Avatar name={member.displayName} size={40} />
        <View className="flex-1 gap-0.5">
          <Text variant="label" className="text-[15px]">
            {member.displayName}
            {isYou ? ` (${t('common.you')})` : ''}
          </Text>
          {admin ? (
            <Text variant="caption" color="primary">
              {t('common.admin')}
            </Text>
          ) : null}
        </View>
        {member.phone && !isYou ? (
          <View className="flex-row gap-2.5">
            <ContactButton kind="call" label={t('members.call', { name: member.displayName })} url={`tel:${member.phone}`} />
            <ContactButton kind="whatsapp" label={t('members.whatsapp', { name: member.displayName })} url={`https://wa.me/${member.phone.replace(/\D/g, '')}`} />
          </View>
        ) : null}
        {canRemove && !confirming ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('members.remove.action', { name: member.displayName })} onPress={() => setConfirming(true)} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full active:opacity-60">
            <Ionicons name="person-remove-outline" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {confirming ? (
        <View className="gap-2 rounded-[12px] bg-panel p-3">
          <Text variant="caption">{t('members.remove.confirm', { name: member.displayName })}</Text>
          <View className="flex-row gap-2">
            <Button title={t('common.cancel')} size="compact" variant="secondary" className="flex-1" disabled={busy} onPress={() => setConfirming(false)} />
            <Button title={t('members.remove.yes')} size="compact" variant="danger" className="flex-1" loading={busy} disabled={busy} onPress={confirm} />
          </View>
        </View>
      ) : null}
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function callWhen(iso: string, locale: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function CommunityScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { members, loading, error, isAdmin, refresh, remove } = useMembers();
  const { next, past } = useCalls();
  const [tab, setTab] = useState<Tab>('calls');
  const [onCall, setOnCall] = useState<string[]>([]);
  const live = next?.status === 'live';
  const joinable = next ? live || isJoinable(next, new Date()) : false;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (!next) return;
    callsService
      .participants(next.id)
      .then(setOnCall)
      .catch(() => setOnCall([]));
  }, [next?.id, next?.participantCount]);

  return (
    <Screen edges={['top']} backdrop className="px-0 pt-0">
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-24 pt-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <TabHeader title={t('community.title')} subtitle={members.length === 1 ? t('community.member') : t('community.members', { count: members.length })} right={<HeaderActions />} />
        <Segments<Tab>
          options={[
            { value: 'calls', label: t('community.calls') },
            { value: 'members', label: t('community.membersTab') },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'calls' ? (
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text variant="title" className="text-[17px]">
                {live ? t('community.happeningNow') : t('community.nextCall')}
              </Text>
              <View className="flex-row items-center gap-3">
                <Pressable accessibilityRole="button" onPress={() => router.push('/calls/history')} hitSlop={8} className="flex-row items-center gap-1 py-1">
                  <Ionicons name="time-outline" size={15} color={colors.primary} />
                  <Text variant="label" color="primary" className="text-[13px]">
                    {t('common.history')}
                  </Text>
                </Pressable>
                {isAdmin ? <Button title={t('community.schedule')} size="compact" variant="secondary" icon="add" onPress={() => router.push('/calls/schedule')} /> : null}
              </View>
            </View>
            {next ? (
              <Card tone={live ? 'sage' : 'lavender'} className="gap-4">
                <View className="flex-row items-center gap-3">
                  <View className={`h-12 w-12 items-center justify-center rounded-full ${live ? 'bg-leaf' : 'bg-primary'}`}>
                    <Ionicons name="call" size={20} color={colors.surface} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text variant="label" className="text-[16px]">
                      {callTitle(next.title, t)}
                    </Text>
                    <Text variant="caption" color={live ? 'leaf' : 'primary'}>
                      {live ? (onCall.length === 1 ? t('community.oneOnCall') : t('community.onCall', { count: onCall.length })) : callWhen(next.scheduledAt, locale)}
                    </Text>
                  </View>
                </View>
                {onCall.length ? <AvatarStack names={onCall} size={32} /> : null}
                <Button title={joinable ? t('community.joinNow') : t('community.viewDetails')} icon={joinable ? 'call' : undefined} onPress={() => router.push({ pathname: '/calls/[id]', params: { id: next.id } })} />
              </Card>
            ) : (
              <Card className="gap-2">
                <Text variant="label" className="text-[15px]">
                  {t('community.noCallTitle')}
                </Text>
                <Text variant="caption">{isAdmin ? t('community.noCallAdmin') : t('community.noCallMember')}</Text>
              </Card>
            )}
            {past.length ? (
              <View className="gap-2">
                <Text variant="caption">{t('community.recentCalls')}</Text>
                <Card className="py-1">
                  {past.slice(0, 3).map((c, i) => (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/calls/[id]', params: { id: c.id } })}
                      className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
                    >
                      <View className="h-9 w-9 items-center justify-center rounded-full bg-lavender">
                        <Ionicons name="call-outline" size={16} color={colors.primary} />
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text variant="label" className="text-[15px]">
                          {callTitle(c.title, t)}
                        </Text>
                        <Text variant="caption">
                          {new Date(c.scheduledAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · {c.participantCount} {t('common.joined')}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </Card>
              </View>
            ) : null}
          </View>
        ) : (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text variant="title" className="text-[17px]">
                {members.length === 1 ? t('community.member') : t('community.members', { count: members.length })}
              </Text>
              {isAdmin ? <Button title={t('community.addMember')} size="compact" variant="secondary" icon="add" onPress={() => router.push('/add-member')} /> : null}
            </View>
            {loading && !members.length ? (
              <ActivityIndicator color={colors.primary} className="mt-6" />
            ) : !members.length ? (
              <Text variant="muted">{t('community.noMembers')}</Text>
            ) : (
              <Card className="py-1">
                {members.map((m, i) => (
                  <MemberRow key={m.id} member={m} isYou={m.userId === user?.id} last={i === members.length - 1} canRemove={isAdmin && m.userId !== user?.id} onRemove={remove} />
                ))}
              </Card>
            )}
          </View>
        )}
        {error ? (
          <Text variant="caption" color="roseDeep">
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
