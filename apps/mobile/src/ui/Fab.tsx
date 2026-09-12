import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { colors } from '../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = { label: string; icon?: IconName; onPress: () => void };

/** The one create action on a list screen: a purple disc anchored bottom right. */
export function Fab({ label, icon = 'add', onPress }: Props) {
  return (
    <View style={{ pointerEvents: 'box-none' }} className="absolute bottom-28 right-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-85"
        style={{ boxShadow: '0 8px 20px rgba(91, 63, 166, 0.35)' }}
      >
        <Ionicons name={icon} size={28} color={colors.surface} />
      </Pressable>
    </View>
  );
}
