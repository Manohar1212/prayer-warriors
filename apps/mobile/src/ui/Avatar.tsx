import { View } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

/** Everyone gets the same disc: violet initials on lavender. */
export function avatarTone(_name: string): { bg: string; fg: string } {
  return { bg: colors.lavender, fg: colors.primary };
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
