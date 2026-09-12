import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = { label: string; icon?: IconName; onPress: () => void };

/** The one create action on a list screen: a purple disc anchored bottom right. */
/** Height of the floating tab bar plus its gap; the button clears it on every device. */
const TAB_BAR_CLEARANCE = 66 + 12 + 12;

export function Fab({ label, icon = 'add', onPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ pointerEvents: 'box-none', position: 'absolute', right: 16, bottom: Math.max(insets.bottom, 12) + TAB_BAR_CLEARANCE }}>
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
