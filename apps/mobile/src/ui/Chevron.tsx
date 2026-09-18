import Svg, { Path } from 'react-native-svg';

/** A thin, rounded "<" for back controls: quieter than the icon font's heavy glyph. */
export function Chevron({ size = 22, color, direction = 'back' }: { size?: number; color: string; direction?: 'back' | 'forward' }) {
  const d = direction === 'back' ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
