import { View } from 'react-native';

import { Text, type TextColor } from './Text';

export type MetaPart = { text: string; color?: TextColor; dot?: 'sage' | 'blush' | 'honey' | 'forest' | 'gold' };

const dotClass: Record<NonNullable<MetaPart['dot']>, string> = {
  sage: 'bg-primary',
  blush: 'bg-rose-deep',
  honey: 'bg-gold',
  forest: 'bg-primary',
  gold: 'bg-gold',
};

/**
 * One quiet line of facts about an item ("Family · Urgent · 2 praying"). A leading dot carries the
 * category colour so lists read without pill badges.
 */
export function Meta({ parts, className = '' }: { parts: MetaPart[]; className?: string }) {
  const visible = parts.filter((p) => p.text);
  return (
    <View className={`flex-row flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      {visible.map((p, i) => (
        <View key={`${p.text}-${i}`} className="flex-row items-center gap-2">
          {i > 0 ? (
            <Text variant="muted" className="text-[13px]">
              ·
            </Text>
          ) : null}
          {p.dot ? <View className={`h-2 w-2 rounded-full ${dotClass[p.dot]}`} /> : null}
          <Text variant="label" color={p.color ?? 'muted'} className="text-[13px] leading-[18px]">
            {p.text}
          </Text>
        </View>
      ))}
    </View>
  );
}
