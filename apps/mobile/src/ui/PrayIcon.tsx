import { MaterialCommunityIcons } from '@expo/vector-icons';

/** Praying hands, the one glyph the app needs that Ionicons does not have. */
export function PrayIcon({ size = 20, color }: { size?: number; color: string }) {
  return <MaterialCommunityIcons name="hands-pray" size={size} color={color} />;
}
