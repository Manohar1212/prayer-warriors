import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { colors } from '../theme/tokens';
import { Text, type TextColor } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse';

export type ButtonSize = 'regular' | 'compact';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
};

const sizing: Record<ButtonSize, { box: string; text: string }> = {
  regular: { box: 'min-h-[52px] rounded-[14px] px-6', text: 'text-[16px]' },
  compact: { box: 'min-h-[36px] rounded-full px-4', text: 'text-[13px]' },
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
  size = 'regular',
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
      className={`items-center justify-center active:opacity-85 ${/\bpx-/.test(className) ? sizing[size].box.replace(/\s?px-\d+/, '') : sizing[size].box} ${container[variant]} ${blocked ? 'opacity-40' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator testID="button-spinner" color={spinner[variant]} />
      ) : (
        <Text color={label[variant]} className={`font-semibold ${sizing[size].text}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
