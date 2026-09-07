import { StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme/tokens';

/** Soft overlapping colour washes behind a screen. Purely decorative. */
export function Backdrop() {
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      viewBox="0 0 390 844"
      preserveAspectRatio="xMaxYMin slice"
    >
      <Circle cx={330} cy={60} r={150} fill={colors.honey} opacity={0.9} />
      <Circle cx={420} cy={220} r={120} fill={colors.blush} opacity={0.9} />
      <Circle cx={250} cy={-40} r={110} fill={colors.sage} opacity={0.85} />
    </Svg>
  );
}
