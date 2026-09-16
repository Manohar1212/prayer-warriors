import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Rect, RadialGradient, Stop } from 'react-native-svg';

export type AuroraPalette = 'dawn' | 'day' | 'dusk' | 'plum';

type Blob = { cx: string; cy: string; rx: string; ry: string; color: string; opacity: number };
type Sky = { stops: [string, string, string]; blobs: Blob[] };

/**
 * Each sky is dark at the bottom so white text stays legible, with the light coming in from the
 * top corner like a window: warm at dawn, clear by day, gold and rose at dusk.
 */
const skies: Record<AuroraPalette, Sky> = {
  dawn: {
    stops: ['#3B2A7C', '#241A55', '#1A123F'],
    blobs: [
      { cx: '88%', cy: '10%', rx: '58%', ry: '38%', color: '#F2B48F', opacity: 0.7 },
      { cx: '18%', cy: '38%', rx: '42%', ry: '30%', color: '#D98CA8', opacity: 0.45 },
    ],
  },
  day: {
    stops: ['#4A5BB8', '#2A2F6E', '#1C1F4F'],
    blobs: [
      { cx: '86%', cy: '12%', rx: '58%', ry: '38%', color: '#A9CDF7', opacity: 0.6 },
      { cx: '15%', cy: '40%', rx: '42%', ry: '30%', color: '#C9B8F0', opacity: 0.4 },
    ],
  },
  dusk: {
    stops: ['#5A3D8C', '#2B1F63', '#160F3A'],
    blobs: [
      { cx: '86%', cy: '12%', rx: '58%', ry: '38%', color: '#E0B86A', opacity: 0.55 },
      { cx: '18%', cy: '40%', rx: '42%', ry: '30%', color: '#C87F9A', opacity: 0.4 },
    ],
  },
  plum: {
    stops: ['#5B3FA6', '#3A2A78', '#241848'],
    blobs: [
      { cx: '90%', cy: '8%', rx: '55%', ry: '40%', color: '#B69CE8', opacity: 0.45 },
      { cx: '10%', cy: '60%', rx: '40%', ry: '32%', color: '#D98CA8', opacity: 0.25 },
    ],
  },
};

/** The sky for this hour: warm before noon, clear until five, deep after. */
export function paletteForHour(hour: number): AuroraPalette {
  if (hour < 12) return 'dawn';
  if (hour < 17) return 'day';
  return 'dusk';
}

type Props = { palette?: AuroraPalette; style?: StyleProp<ViewStyle> };

/** A painted sky: a vertical gradient with two soft glows. Stretches to whatever box it is given. */
export function Aurora({ palette = 'plum', style }: Props) {
  const sky = skies[palette];
  const id = `aurora-${palette}`;
  return (
    <View pointerEvents="none" style={style}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.stops[0]} />
            <Stop offset="0.55" stopColor={sky.stops[1]} />
            <Stop offset="1" stopColor={sky.stops[2]} />
          </LinearGradient>
          {sky.blobs.map((b, i) => (
            <RadialGradient key={i} id={`${id}-glow-${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={b.color} stopOpacity={b.opacity} />
              <Stop offset="1" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill={`url(#${id}-sky)`} />
        {sky.blobs.map((b, i) => (
          <Ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={`url(#${id}-glow-${i})`} />
        ))}
      </Svg>
    </View>
  );
}
