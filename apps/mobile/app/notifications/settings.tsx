import { useEffect, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';

import { DEFAULT_PREFS, PREF_KEYS, type NotificationPrefs, type PrefKey } from '@/features/notifications';
import { useLanguage, type TranslationKey } from '@/i18n';
import { notificationsService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Card, Screen, Text } from '@/ui';

export default function NotificationSettingsScreen() {
  const { t } = useLanguage();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    notificationsService
      .getPrefs()
      .then(setPrefs)
      .catch((err) => setError(err instanceof Error ? err.message : t('notifications.settingsLoadFailed')))
      .finally(() => setLoaded(true));
  }, []);

  const toggle = async (key: PrefKey, value: boolean) => {
    const previous = prefs;
    setError(null);
    setPrefs({ ...prefs, [key]: value });
    try {
      setPrefs(await notificationsService.updatePrefs({ [key]: value }));
    } catch (err) {
      setPrefs(previous);
      setError(err instanceof Error ? err.message : t('notifications.saveFailed'));
    }
  };

  return (
    <Screen edges={['bottom']} backdrop className="px-0 pt-0">
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <Text variant="muted">{t('notifications.settingsIntro')}</Text>
        {error ? (
          <Text variant="body" color="roseDeep">
            {error}
          </Text>
        ) : null}
        <Card className="gap-0 py-1">
          {PREF_KEYS.map((key, index) => (
            <View key={key} className={`flex-row items-center gap-4 py-4 ${index < PREF_KEYS.length - 1 ? 'border-b border-border' : ''}`}>
              <View className="flex-1 gap-1">
                <Text variant="label" className="text-[15px]">
                  {t(`notifications.pref.${key}` as TranslationKey)}
                </Text>
                <Text variant="muted" className="text-[13px] leading-[18px]">
                  {t(`notifications.pref.${key}Hint` as TranslationKey)}
                </Text>
              </View>
              <Switch
                accessibilityLabel={t(`notifications.pref.${key}` as TranslationKey)}
                value={prefs[key]}
                disabled={!loaded}
                onValueChange={(value) => toggle(key, value)}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.cream}
              />
            </View>
          ))}
        </Card>
        <Text variant="muted" className="text-[13px]">
          {t('notifications.reminderNote')}
        </Text>
      </ScrollView>
    </Screen>
  );
}
