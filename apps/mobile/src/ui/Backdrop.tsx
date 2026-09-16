import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { gradients } from '../theme/tokens';

/** The page itself: peach at the top melting through lavender into white. */
export function Backdrop() {
  return <LinearGradient pointerEvents="none" colors={[...gradients.welcome]} locations={[0, 0.45, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />;
}
