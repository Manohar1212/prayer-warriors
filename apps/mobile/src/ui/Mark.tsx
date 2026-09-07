import Svg, { Circle, Line } from 'react-native-svg';

import { colors } from '../theme/tokens';

type Props = { size?: number; ring?: string; cross?: string };

/** Brand mark: a thin halo ring with a slender cross. */
export function Mark({ size = 72, ring = colors.gold, cross = colors.cream }: Props) {
  const c = size / 2;
  const r = size * 0.44;
  const arm = size * 0.19;
  const stem = size * 0.27;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel="Prayer Warriors">
      <Circle cx={c} cy={c} r={r} stroke={ring} strokeWidth={size * 0.028} fill="none" />
      <Line x1={c} y1={c - stem} x2={c} y2={c + stem} stroke={cross} strokeWidth={size * 0.04} strokeLinecap="round" />
      <Line x1={c - arm} y1={c - stem * 0.4} x2={c + arm} y2={c - stem * 0.4} stroke={cross} strokeWidth={size * 0.04} strokeLinecap="round" />
    </Svg>
  );
}
