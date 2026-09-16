import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { unregisterThisDevice } from '@/features/notifications/PushRegistrar';
import { useLanguage, type Language } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Avatar, Button, Card, Screen, Segments, Text } from '@/ui';

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
    <Screen edges={['bottom']} className="gap-6 pt-6">
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
