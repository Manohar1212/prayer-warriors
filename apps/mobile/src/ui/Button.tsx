import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
};

const container: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface border border-primary',
  ghost: 'bg-transparent',
};

const label: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-primary',
  ghost: 'text-primary',
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...rest
}: Props) {
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      className={`min-h-12 items-center justify-center rounded-xl px-5 py-3 active:opacity-80 ${container[variant]} ${blocked ? 'opacity-50' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-spinner"
          color={variant === 'primary' ? colors.surface : colors.primary}
        />
      ) : (
        <Text variant="label" className={`text-base font-semibold ${label[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
