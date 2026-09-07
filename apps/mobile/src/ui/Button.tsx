import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { colors } from '../theme/tokens';
import { Text, type TextColor } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
};

const container: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-transparent border border-primary',
  ghost: 'bg-transparent',
  inverse: 'bg-cream',
};

const label: Record<ButtonVariant, TextColor> = {
  primary: 'cream',
  secondary: 'primary',
  ghost: 'primary',
  inverse: 'primaryDark',
};

const spinner: Record<ButtonVariant, string> = {
  primary: colors.cream,
  secondary: colors.primary,
  ghost: colors.primary,
  inverse: colors.primaryDark,
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
      className={`min-h-[52px] items-center justify-center rounded-[14px] px-6 active:opacity-85 ${container[variant]} ${blocked ? 'opacity-40' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator testID="button-spinner" color={spinner[variant]} />
      ) : (
        <Text color={label[variant]} className="font-semibold text-[16px]">
          {title}
        </Text>
      )}
    </Pressable>
  );
}
