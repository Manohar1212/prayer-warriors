import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '../theme/tokens';

type Props = { size?: number; ring?: string; cross?: string; glow?: boolean };

/** Brand mark: a thin halo ring with a slender cross, optionally on a warm glow. */
export function Mark({ size = 72, ring = colors.gold, cross = colors.cream, glow = false }: Props) {
  const box = glow ? size * 2.2 : size;
  const c = box / 2;
  const r = size * 0.44;
  const arm = size * 0.19;
  const stem = size * 0.27;
  return (
    <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} accessibilityLabel="Prayer Warriors">
      {glow ? (
        <>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.goldLight} stopOpacity={0.45} />
              <Stop offset="55%" stopColor={colors.gold} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={colors.gold} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={c} cy={c} r={box / 2} fill="url(#glow)" />
        </>
      ) : null}
      <Circle cx={c} cy={c} r={r} stroke={ring} strokeWidth={size * 0.028} fill="none" />
      <Line x1={c} y1={c - stem} x2={c} y2={c + stem} stroke={cross} strokeWidth={size * 0.04} strokeLinecap="round" />
      <Line x1={c - arm} y1={c - stem * 0.4} x2={c + arm} y2={c - stem * 0.4} stroke={cross} strokeWidth={size * 0.04} strokeLinecap="round" />
    </Svg>
  );
}
