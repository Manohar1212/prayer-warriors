import { View, type ViewProps } from 'react-native';

export type CardTone = 'surface' | 'honey' | 'sage' | 'blush' | 'lavender' | 'forest';

const toneClass: Record<CardTone, string> = {
  surface: 'bg-panel',
  honey: 'bg-honey',
  sage: 'bg-sage',
  blush: 'bg-blush',
  lavender: 'bg-lavender',
  forest: 'bg-primary',
};

/** Soft ivory panels on the white page; tinted panels for the few emphasised states. */
export function Card({ tone = 'surface', className = '', style, ...rest }: ViewProps & { tone?: CardTone; className?: string }) {
  return <View className={`rounded-[18px] p-4 ${toneClass[tone]} ${className}`} style={style} {...rest} />;
}
