import { View, type ViewProps } from 'react-native';


export type CardTone = 'surface' | 'honey' | 'sage' | 'blush' | 'lavender' | 'forest';

const toneClass: Record<CardTone, string> = {
  surface: 'bg-surface',
  honey: 'bg-honey',
  sage: 'bg-sage',
  blush: 'bg-blush',
  lavender: 'bg-lavender',
  forest: 'bg-primary',
};

/** Panels on the parchment, edged with a warm hairline; tinted panels for emphasised states. */
export function Card({ tone = 'surface', className = '', style, ...rest }: ViewProps & { tone?: CardTone; className?: string }) {
  return <View className={`rounded-[10px] p-4 ${tone === 'surface' ? 'border border-border' : ''} ${toneClass[tone]} ${className}`} style={style} {...rest} />;
}
