import { LinearGradient } from 'expo-linear-gradient';

/** A soft lavender-to-white wash behind the top of the page, so screens have depth without blocks. */
export function Backdrop() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['#F1ECF8', '#FFFFFF']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
    />
  );
}
