import { View } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

const palette = [
  { bg: '#E4DDF8', fg: '#6D4FD1' },
  { bg: '#FBDDE6', fg: '#C6749A' },
  { bg: '#FBEBCF', fg: '#C99A3F' },
  { bg: '#D9F0E4', fg: '#3E9C6E' },
  { bg: '#DCE9FA', fg: '#4C7DD1' },
];

/** Stable pastel per person so the same name always gets the same disc. */
export function avatarTone(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

type Props = { name: string; size?: number; className?: string };

export function Avatar({ name, size = 40, className = '' }: Props) {
  const tone = avatarTone(name.trim() || '?');
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  return (
    <View
      accessibilityLabel={name}
      className={`items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: tone.bg }}
    >
      <Text className="font-semibold" style={{ color: tone.fg, fontSize: Math.round(size * 0.42), lineHeight: Math.round(size * 0.5) }}>
        {initial}
      </Text>
    </View>
  );
}

/** A short overlapping row of avatars with a "+n" tail. */
export function AvatarStack({ names, size = 32, max = 4 }: { names: string[]; size?: number; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <View className="flex-row items-center">
      {shown.map((n, i) => (
        <View key={`${n}-${i}`} style={{ marginLeft: i === 0 ? 0 : -size * 0.28, borderRadius: size, borderWidth: 2, borderColor: colors.surface }}>
          <Avatar name={n} size={size} />
        </View>
      ))}
      {rest > 0 ? (
        <View
          className="items-center justify-center rounded-full bg-lavender"
          style={{ width: size, height: size, marginLeft: -size * 0.28, borderWidth: 2, borderColor: colors.surface }}
        >
          <Text variant="label" color="primary" className="text-[12px]">
            +{rest}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
