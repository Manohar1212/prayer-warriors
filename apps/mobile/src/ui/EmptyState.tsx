import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;
export type EmptyTone = 'lavender' | 'blush' | 'sage' | 'honey';

const tones: Record<EmptyTone, { bg: string; fg: string }> = {
  lavender: { bg: 'bg-lavender', fg: colors.primary },
  blush: { bg: 'bg-blush', fg: colors.roseDeep },
  sage: { bg: 'bg-sage', fg: colors.leaf },
  honey: { bg: 'bg-honey', fg: colors.gold },
};

export function EmptyState({ icon, tone = 'lavender', title, body }: { icon: IconName; tone?: EmptyTone; title: string; body: string }) {
  const t = tones[tone];
  return (
    <View className="items-center gap-3 px-6 py-10">
      <View className={`h-14 w-14 items-center justify-center rounded-full ${t.bg}`}>
        <Ionicons name={icon} size={24} color={t.fg} />
      </View>
      <Text variant="title" className="text-center text-[17px]">
        {title}
      </Text>
      <Text variant="muted" className="max-w-[280px] text-center text-[15px] leading-[22px]">
        {body}
      </Text>
    </View>
  );
}
