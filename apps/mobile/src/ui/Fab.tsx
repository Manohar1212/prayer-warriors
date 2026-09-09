import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { colors } from '../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = { label: string; icon?: IconName; onPress: () => void };

/** The one create action on a list screen: a forest disc with a gold mark, anchored bottom right. */
export function Fab({ label, icon = 'add', onPress }: Props) {
  return (
    <View style={{ pointerEvents: 'box-none' }} className="absolute bottom-6 right-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-85"
        style={{ boxShadow: '0 6px 14px rgba(14, 42, 34, 0.28)' }}
      >
        <Ionicons name={icon} size={28} color={colors.goldLight} />
      </Pressable>
    </View>
  );
}
