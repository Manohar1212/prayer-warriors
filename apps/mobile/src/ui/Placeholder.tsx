import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { colors } from '../theme/tokens';
import { Screen } from './Screen';
import { Text } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;
export type Accent = 'blush' | 'sage' | 'honey' | 'forest';

const accent: Record<Accent, { bg: string; fg: string }> = {
  blush: { bg: 'bg-blush', fg: colors.roseDeep },
  sage: { bg: 'bg-sage', fg: colors.primary },
  honey: { bg: 'bg-honey', fg: colors.gold },
  forest: { bg: 'bg-primary', fg: colors.cream },
};

type Props = { title: string; message: string; icon: IconName; tone: Accent };

export function Placeholder({ title, message, icon, tone }: Props) {
  const a = accent[tone];
  return (
    <Screen backdrop className="justify-center">
      <View className="items-start gap-6">
        <View className={`h-16 w-16 items-center justify-center rounded-[22px] ${a.bg}`}>
          <Ionicons name={icon} size={28} color={a.fg} />
        </View>
        <View className="gap-2">
          <Text variant="title">{title}</Text>
          <Text variant="muted" className="max-w-[300px] text-[15px] leading-[22px]">
            {message}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
