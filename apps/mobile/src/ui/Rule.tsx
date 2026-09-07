import { View } from 'react-native';

/** A single gold hairline. Use once per screen at most. */
export function Rule({ className = '' }: { className?: string }) {
  return <View className={`h-px w-12 bg-gold ${className}`} />;
}
