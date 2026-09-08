import { View, type ViewProps } from 'react-native';

export type CardTone = 'surface' | 'honey' | 'sage' | 'blush';

const toneClass: Record<CardTone, string> = {
  surface: 'border-border bg-surface',
  honey: 'border-honey bg-honey',
  sage: 'border-sage bg-sage',
  blush: 'border-blush bg-blush',
};

export function Card({
  tone = 'surface',
  className = '',
  ...rest
}: ViewProps & { tone?: CardTone; className?: string }) {
  return <View className={`rounded-[20px] border p-5 ${toneClass[tone]} ${className}`} {...rest} />;
}
