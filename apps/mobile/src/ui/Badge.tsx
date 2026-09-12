import { View } from 'react-native';

import { Text, type TextColor } from './Text';

export type BadgeTone = 'sage' | 'blush' | 'honey' | 'forest' | 'lavender';

const tone: Record<BadgeTone, { bg: string; fg: TextColor }> = {
  sage: { bg: 'bg-sage', fg: 'leaf' },
  blush: { bg: 'bg-blush', fg: 'roseDeep' },
  honey: { bg: 'bg-honey', fg: 'gold' },
  forest: { bg: 'bg-primary', fg: 'cream' },
  lavender: { bg: 'bg-lavender', fg: 'primary' },
};

export function Badge({ label, tone: t = 'sage' }: { label: string; tone?: BadgeTone }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${tone[t].bg}`}>
      <Text variant="label" color={tone[t].fg} className="text-[12px] leading-[16px]">
        {label}
      </Text>
    </View>
  );
}
