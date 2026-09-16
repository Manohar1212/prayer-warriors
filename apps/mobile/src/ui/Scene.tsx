import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  /** Fades the lower part to dark so white text stays readable on top of it. */
  dim?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A sunrise over mountains with a cross on the near hill, drawn as vectors so it ships with the
 * app and scales to any box. Stands in for the photographs in the design until real ones are added.
 */
export function Scene({ dim = false, style }: Props) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width="100%" height="100%" viewBox="0 0 390 260" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#6F97CF" />
            <Stop offset="0.45" stopColor="#C9B7C9" />
            <Stop offset="0.7" stopColor="#F2C58C" />
            <Stop offset="1" stopColor="#F7DDB5" />
          </LinearGradient>
          <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFF3C4" stopOpacity={1} />
            <Stop offset="0.35" stopColor="#FFD98A" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#FFD98A" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="dim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B1526" stopOpacity={0} />
            <Stop offset="0.55" stopColor="#0B1526" stopOpacity={0.25} />
            <Stop offset="1" stopColor="#0B1526" stopOpacity={0.75} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="260" fill="url(#sky)" />
        <Circle cx="150" cy="150" r="95" fill="url(#sun)" />
        {/* far ridges */}
        <Path d="M0 172 L40 150 L80 165 L120 140 L165 160 L210 135 L250 158 L295 138 L340 156 L390 132 L390 260 L0 260 Z" fill="#6D82A6" fillOpacity={0.55} />
        <Path d="M0 196 L45 178 L90 192 L140 170 L185 190 L230 172 L280 194 L330 176 L390 190 L390 260 L0 260 Z" fill="#3D5273" fillOpacity={0.85} />
        {/* near hill with the cross */}
        <Path d="M0 232 L60 214 L120 226 L190 206 L260 222 L320 204 L390 220 L390 260 L0 260 Z" fill="#1E2D42" />
        <Rect x="299" y="150" width="6" height="62" rx="1.5" fill="#101A2A" />
        <Rect x="286" y="164" width="32" height="6" rx="1.5" fill="#101A2A" />
        {dim ? <Rect x="0" y="0" width="390" height="260" fill="url(#dim)" /> : null}
      </Svg>
    </View>
  );
}
