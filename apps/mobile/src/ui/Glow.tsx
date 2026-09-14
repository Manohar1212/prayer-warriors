import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '../theme/tokens';

type Props = { size: number; color?: string; strength?: number };

/** A soft white radial halo to sit behind the logo on dark backgrounds. Purely decorative. */
export function Glow({ size, color = colors.surface, strength = 0.5 }: Props) {
  const c = size / 2;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={strength} />
            <Stop offset="45%" stopColor={color} stopOpacity={strength * 0.35} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={c} fill="url(#halo)" />
      </Svg>
    </View>
  );
}
