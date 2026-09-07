import { TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

type Props = TextInputProps & { label?: string; error?: string | null; className?: string };

export function Input({ label, error, className = '', ...rest }: Props) {
  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        className={`min-h-12 rounded-xl border bg-surface px-4 py-3 font-sans text-base text-ink ${
          error ? 'border-rose' : 'border-border'
        }`}
        {...rest}
      />
      {error ? <Text className="text-sm text-rose">{error}</Text> : null}
    </View>
  );
}
