import Svg, { Rect } from 'react-native-svg';

import { colors } from '../theme/tokens';

/** A thin cross, drawn rather than typed so every font renders it the same. */
export function CrossMark({ size = 40, color = colors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x={18.6} y={2} width={2.8} height={36} rx={1.2} fill={color} />
      <Rect x={9} y={11} width={22} height={2.8} rx={1.2} fill={color} />
    </Svg>
  );
}
