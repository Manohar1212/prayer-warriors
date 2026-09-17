import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Seven photographs (Pexels, free licence), each a different place and light. */
export type SceneVariant = 'cross' | 'mountains' | 'night' | 'sea' | 'hills' | 'rays' | 'glass';

/** Each photo is bundled twice, cropped around its subject: wide (2:1) for cards, tall (4:5) for full screens. */
const photos: Record<SceneVariant, { wide: number; tall: number }> = {
  cross: { wide: require('../../assets/promise/cross.jpg'), tall: require('../../assets/promise/cross-tall.jpg') },
  mountains: { wide: require('../../assets/promise/mountains.jpg'), tall: require('../../assets/promise/mountains-tall.jpg') },
  night: { wide: require('../../assets/promise/night.jpg'), tall: require('../../assets/promise/night-tall.jpg') },
  sea: { wide: require('../../assets/promise/sea.jpg'), tall: require('../../assets/promise/sea-tall.jpg') },
  hills: { wide: require('../../assets/promise/hills.jpg'), tall: require('../../assets/promise/hills-tall.jpg') },
  rays: { wide: require('../../assets/promise/rays.jpg'), tall: require('../../assets/promise/rays-tall.jpg') },
  glass: { wide: require('../../assets/promise/glass.jpg'), tall: require('../../assets/promise/glass-tall.jpg') },
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
  /** 'wide' for the Home card, 'tall' for the promise screen, the share card and Welcome. */
  shape?: 'wide' | 'tall';
  /** Darkens the lower part so white text stays readable on top of it. */
  dim?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A photograph filling its box, with an optional dark fade for text laid over it. */
export function Scene({ variant = 'mountains', shape = 'wide', dim = false, style }: Props) {
  return (
    <View pointerEvents="none" style={[{ overflow: 'hidden', backgroundColor: '#1E2D42' }, style]}>
      <Image source={photos[variant][shape]} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
      {dim ? (
        <LinearGradient colors={['rgba(11,21,38,0.05)', 'rgba(11,21,38,0.35)', 'rgba(11,21,38,0.8)']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      ) : null}
    </View>
  );
}
