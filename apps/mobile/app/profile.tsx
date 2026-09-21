import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { formatMobile, parseMobile, useAuth } from '@/features/auth';
import { unregisterThisDevice } from '@/features/notifications/PushRegistrar';
import { useLanguage, type Language } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Avatar, Button, Card, Input, Screen, Segments, Text } from '@/ui';

function Row({ icon, title, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; title: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={!onPress} className={`flex-row items-center gap-3 py-3.5 ${last ? '' : 'border-b border-border'}`}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-lavender">
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <Text variant="label" className="flex-1 text-[15px]">
        {title}
      </Text>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

/** Your own mobile number, which the group uses for the call and WhatsApp buttons. */
function MobileCard() {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const saved = user?.phone ?? '';
  const [text, setText] = useState(saved ? formatMobile(saved) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const parsed = text.trim() ? parseMobile(text) : '';
  const changed = parsed !== null && parsed !== saved;

  async function save() {
    if (parsed === null) return setError(t('profile.mobileInvalid'));
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ phone: parsed });
      if (parsed) setText(formatMobile(parsed));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.mobileFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-lavender">
          <Ionicons name="call-outline" size={17} color={colors.primary} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="label" className="text-[15px]">
            {t('profile.mobile')}
          </Text>
          <Text variant="caption">{t('profile.mobileHint')}</Text>
        </View>
      </View>
      <Input
        left="call-outline"
        placeholder={t('profile.mobilePlaceholder')}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        value={text}
        onChangeText={(v) => {
          setText(v);
          setDone(false);
          setError(null);
        }}
        onSubmitEditing={save}
        error={error ?? (text.trim() && parsed === null ? t('profile.mobileInvalid') : null)}
      />
      {changed ? <Button title={t('common.save')} size="compact" onPress={save} loading={busy} /> : done ? <Text variant="caption" color="leaf">{t('profile.mobileSaved')}</Text> : null}
    </Card>
  );
}

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const leave = async () => {
    await unregisterThisDevice();
    await signOut();
  };
  const name = user?.displayName ?? t('common.member');
  const version = Constants.expoConfig?.version ?? '';
  return (
    <Screen edges={['bottom']} scroll className="gap-6 pt-6">
      <View className="items-center gap-3">
        <Avatar name={name} size={96} />
        <View className="items-center gap-1">
          <Text variant="display" className="text-[22px] leading-[28px]">
            {name}
          </Text>
          <Text variant="caption">{user?.email}</Text>
        </View>
        <Text variant="scripture" color="muted" className="max-w-[280px] text-center text-[15px] leading-[23px]">
          {t('profile.verse')}
        </Text>
        <Text variant="caption">{t('profile.verseRef')}</Text>
      </View>
      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-lavender">
            <Ionicons name="language-outline" size={17} color={colors.primary} />
          </View>
          <Text variant="label" className="flex-1 text-[15px]">
            {t('profile.language')}
          </Text>
        </View>
        <Segments<Language>
          variant="pill"
          options={[
            { value: 'en', label: t('language.en') },
            { value: 'te', label: t('language.te') },
          ]}
          value={language}
          onChange={setLanguage}
        />
      </Card>
      <MobileCard />
      <Card className="py-1">
        <Row icon="notifications-outline" title={t('profile.notificationSettings')} onPress={() => router.push('/notifications/settings')} />
        <Row icon="book-outline" title={t('profile.journal')} onPress={() => router.push('/journal')} />
        <Row icon="information-circle-outline" title={version ? `Prayer Warriors ${version}` : 'Prayer Warriors'} last />
      </Card>
      <View className="mt-auto">
        <Button title={t('profile.signOut')} variant="danger" onPress={leave} />
      </View>
    </Screen>
  );
}
