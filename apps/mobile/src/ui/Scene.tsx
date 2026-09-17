import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Seven photographs (Pexels, free licence), each a different place and light. */
export type SceneVariant = 'cross' | 'mountains' | 'night' | 'sea' | 'hills' | 'rays' | 'glass';

const photos: Record<SceneVariant, number> = {
  cross: require('../../assets/promise/cross.jpg'),
  mountains: require('../../assets/promise/mountains.jpg'),
  night: require('../../assets/promise/night.jpg'),
  sea: require('../../assets/promise/sea.jpg'),
  hills: require('../../assets/promise/hills.jpg'),
  rays: require('../../assets/promise/rays.jpg'),
  glass: require('../../assets/promise/glass.jpg'),
};

const ALL = Object.keys(photos) as SceneVariant[];

let last: SceneVariant | null = null;

/** A random photo, never the same one twice in a row. */
export function randomSceneVariant(): SceneVariant {
  const pool = ALL.filter((v) => v !== last);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  last = pick;
  return pick;
}

type Props = {
  variant?: SceneVariant;
  /** Darkens the lower part so white text stays readable on top of it. */
  dim?: boolean;
  /** Kept for callers; photos are centred in any box. */
  align?: 'center' | 'right';
  style?: StyleProp<ViewStyle>;
};

/** A photograph filling its box, with an optional dark fade for text laid over it. */
export function Scene({ variant = 'mountains', dim = false, style }: Props) {
  return (
    <View pointerEvents="none" style={[{ overflow: 'hidden', backgroundColor: '#1E2D42' }, style]}>
      <Image source={photos[variant]} resizeMode="cover" style={StyleSheet.absoluteFill} />
      {dim ? (
        <LinearGradient colors={['rgba(11,21,38,0.05)', 'rgba(11,21,38,0.35)', 'rgba(11,21,38,0.8)']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      ) : null}
    </View>
  );
}
