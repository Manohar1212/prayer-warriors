import { View, type ViewProps } from 'react-native';

export function Card({ className = '', ...rest }: ViewProps & { className?: string }) {
  return (
    <View className={`rounded-[20px] border border-border bg-surface p-5 ${className}`} {...rest} />
  );
}
