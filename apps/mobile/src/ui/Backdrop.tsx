import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

type Wash = { cx: string; cy: string; rx: string; ry: string; color: string; opacity: number };

/** Three soft washes, like colour bleeding into wet paper: rose top right, sage left, honey mid right. */
const washes: Wash[] = [
  { cx: '92%', cy: '4%', rx: '70%', ry: '22%', color: '#F4B4C8', opacity: 0.55 },
  { cx: '2%', cy: '22%', rx: '52%', ry: '18%', color: '#B4D6C4', opacity: 0.6 },
  { cx: '78%', cy: '40%', rx: '46%', ry: '15%', color: '#FFE0AA', opacity: 0.55 },
  { cx: '10%', cy: '78%', rx: '50%', ry: '16%', color: '#F4B4C8', opacity: 0.22 },
];

export function Backdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          {washes.map((w, i) => (
            <RadialGradient key={i} id={`wash-${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={w.color} stopOpacity={w.opacity} />
              <Stop offset="0.6" stopColor={w.color} stopOpacity={w.opacity * 0.45} />
              <Stop offset="1" stopColor={w.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {washes.map((w, i) => (
          <Ellipse key={i} cx={w.cx} cy={w.cy} rx={w.rx} ry={w.ry} fill={`url(#wash-${i})`} />
        ))}
      </Svg>
    </View>
  );
}
