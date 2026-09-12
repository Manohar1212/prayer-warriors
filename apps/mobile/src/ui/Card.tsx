import { View, type ViewProps } from 'react-native';

import { cardShadow } from '../theme/tokens';

export type CardTone = 'surface' | 'honey' | 'sage' | 'blush' | 'lavender' | 'forest';

const toneClass: Record<CardTone, string> = {
  surface: 'bg-surface',
  honey: 'bg-honey',
  sage: 'bg-sage',
  blush: 'bg-blush',
  lavender: 'bg-lavender',
  forest: 'bg-primary',
};

/** White cards float on a soft shadow; tinted cards sit flat. */
export function Card({ tone = 'surface', className = '', style, ...rest }: ViewProps & { tone?: CardTone; className?: string }) {
  return <View className={`rounded-[20px] p-4 ${toneClass[tone]} ${className}`} style={[tone === 'surface' ? cardShadow : null, style]} {...rest} />;
}
