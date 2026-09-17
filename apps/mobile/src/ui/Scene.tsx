import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, RadialGradient, Stop } from 'react-native-svg';

export type SceneVariant = 'dawn' | 'golden' | 'rose' | 'dusk' | 'night';

type Sky = {
  stops: [string, string, string, string];
  sun: { cx: number; cy: number; r: number; core: string; glow: string } | null;
  stars: boolean;
  ridges: [string, string, string];
};

/** Five skies over the same mountains; each has its own light. */
const skies: Record<SceneVariant, Sky> = {
  dawn: { stops: ['#6F97CF', '#C9B7C9', '#F2C58C', '#F7DDB5'], sun: { cx: 150, cy: 150, r: 95, core: '#FFF3C4', glow: '#FFD98A' }, stars: false, ridges: ['#6D82A6', '#3D5273', '#1E2D42'] },
  golden: { stops: ['#5E8BC9', '#F0B667', '#F6C97A', '#FBE3B0'], sun: { cx: 240, cy: 140, r: 110, core: '#FFF9D6', glow: '#FFC85C' }, stars: false, ridges: ['#7A6E8F', '#4A3F63', '#2A2440'] },
  rose: { stops: ['#8A6FB8', '#D98BA8', '#F3B18F', '#F8D5B8'], sun: { cx: 110, cy: 160, r: 90, core: '#FFEBD2', glow: '#FFB07A' }, stars: false, ridges: ['#7B5E8A', '#4C3760', '#2B1F3D'] },
  dusk: { stops: ['#2F2A6B', '#6A4E9C', '#C56A8A', '#F0A16A'], sun: { cx: 280, cy: 175, r: 80, core: '#FFE0B0', glow: '#FF9E6A' }, stars: true, ridges: ['#4B3A6E', '#2E2350', '#181233'] },
  night: { stops: ['#0B1633', '#14224A', '#1F2F5C', '#2D3E6B'], sun: { cx: 300, cy: 70, r: 26, core: '#FFF7DA', glow: '#C9D6F5' }, stars: true, ridges: ['#33456B', '#1F2E4F', '#111B33'] },
};

const STARS = [
  [22, 30], [58, 18], [95, 44], [140, 22], [176, 58], [212, 30], [250, 48], [286, 22], [330, 40], [360, 66], [72, 74], [118, 90], [200, 96], [246, 84], [312, 100], [40, 110],
];

export function randomSceneVariant(): SceneVariant {
  const all: SceneVariant[] = ['dawn', 'golden', 'rose', 'dusk', 'night'];
  return all[Math.floor(Math.random() * all.length)];
}

type Props = {
  variant?: SceneVariant;
  /** Fades the lower part to dark so white text stays readable on top of it. */
  dim?: boolean;
  /** Which side to keep when the box is taller than the scene: 'right' keeps the cross in view. */
  align?: 'center' | 'right';
  style?: StyleProp<ViewStyle>;
};

/**
 * A sky over mountains with a cross on the near hill, drawn as vectors so it ships with the app
 * and scales to any box. Stands in for the photographs in the design until real ones are added.
 */
export function Scene({ variant = 'dawn', dim = false, align = 'center', style }: Props) {
  const sky = skies[variant];
  const id = `scene-${variant}`;
  return (
    <View pointerEvents="none" style={style}>
      <Svg width="100%" height="100%" viewBox="0 0 390 260" preserveAspectRatio={align === 'right' ? 'xMaxYMid slice' : 'xMidYMid slice'}>
        <Defs>
          <LinearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.stops[0]} />
            <Stop offset="0.45" stopColor={sky.stops[1]} />
            <Stop offset="0.7" stopColor={sky.stops[2]} />
            <Stop offset="1" stopColor={sky.stops[3]} />
          </LinearGradient>
          {sky.sun ? (
            <RadialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={sky.sun.core} stopOpacity={1} />
              <Stop offset="0.35" stopColor={sky.sun.glow} stopOpacity={0.9} />
              <Stop offset="1" stopColor={sky.sun.glow} stopOpacity={0} />
            </RadialGradient>
          ) : null}
          <LinearGradient id={`${id}-dim`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B1526" stopOpacity={0} />
            <Stop offset="0.55" stopColor="#0B1526" stopOpacity={0.25} />
            <Stop offset="1" stopColor="#0B1526" stopOpacity={0.75} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="260" fill={`url(#${id}-sky)`} />
        {sky.stars ? STARS.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9} fill="#FFFFFF" fillOpacity={variant === 'night' ? 0.9 : 0.5} />) : null}
        {sky.sun ? <Circle cx={sky.sun.cx} cy={sky.sun.cy} r={sky.sun.r} fill={`url(#${id}-sun)`} /> : null}
        {/* far ridges */}
        <Path d="M0 172 L40 150 L80 165 L120 140 L165 160 L210 135 L250 158 L295 138 L340 156 L390 132 L390 260 L0 260 Z" fill={sky.ridges[0]} fillOpacity={0.55} />
        <Path d="M0 196 L45 178 L90 192 L140 170 L185 190 L230 172 L280 194 L330 176 L390 190 L390 260 L0 260 Z" fill={sky.ridges[1]} fillOpacity={0.85} />
        {/* near hill with the cross */}
        <Path d="M0 232 L60 214 L120 226 L190 206 L260 222 L320 204 L390 220 L390 260 L0 260 Z" fill={sky.ridges[2]} />
        <Rect x="299" y="150" width="6" height="62" rx="1.5" fill="#101A2A" />
        <Rect x="286" y="164" width="32" height="6" rx="1.5" fill="#101A2A" />
        {dim ? <Rect x="0" y="0" width="390" height="260" fill={`url(#${id}-dim)`} /> : null}
      </Svg>
    </View>
  );
}

/** The skies in the order they cycle, so no two consecutive ones look alike. */
const CYCLE: SceneVariant[] = ['dawn', 'golden', 'dusk', 'rose', 'night'];

/**
 * A scene that slowly cross-fades to the next sky every `every` milliseconds while mounted.
 * Two scenes are stacked; the top one fades in over the bottom one, then they swap roles.
 */
export function LiveScene({ start, every = 12000, dim = false, style }: { start: SceneVariant; every?: number; dim?: boolean; style?: StyleProp<ViewStyle> }) {
  const [base, setBase] = useState<SceneVariant>(start);
  const [next, setNext] = useState<SceneVariant | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => {
      if (cancelled) return;
      const upcoming = CYCLE[(CYCLE.indexOf(base) + 1) % CYCLE.length];
      setNext(upcoming);
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }).start(({ finished }) => {
        if (!finished || cancelled) return;
        setBase(upcoming);
        setNext(null);
        fade.setValue(0);
      });
    }, every);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [base, every, fade]);

  return (
    <View pointerEvents="none" style={style}>
      <Scene variant={base} dim={dim} style={StyleSheet.absoluteFill} />
      {next ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <Scene variant={next} dim={dim} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
    </View>
  );
}
