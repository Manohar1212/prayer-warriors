import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { cardShadow, colors } from '../theme/tokens';
import { Text, type TextColor } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'danger';
export type ButtonSize = 'regular' | 'compact';
type IconName = keyof typeof Ionicons.glyphMap;

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  className?: string;
};

const container: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface',
  ghost: 'bg-transparent',
  inverse: 'bg-surface',
  danger: 'bg-surface border border-rose',
};

const label: Record<ButtonVariant, TextColor> = {
  primary: 'cream',
  secondary: 'primary',
  ghost: 'primary',
  inverse: 'primaryDark',
  danger: 'roseDeep',
};

const spinner: Record<ButtonVariant, string> = {
  primary: colors.surface,
  secondary: colors.primary,
  ghost: colors.primary,
  inverse: colors.primaryDark,
  danger: colors.roseDeep,
};

const iconColor: Record<ButtonVariant, string> = {
  primary: colors.surface,
  secondary: colors.primary,
  ghost: colors.primary,
  inverse: colors.primaryDark,
  danger: colors.roseDeep,
};

const sizing: Record<ButtonSize, { box: string; text: string; icon: number }> = {
  regular: { box: 'min-h-[52px] rounded-full px-6', text: 'text-[15px]', icon: 18 },
  compact: { box: 'min-h-[38px] rounded-full px-4', text: 'text-[13px]', icon: 15 },
};

export function Button({ title, variant = 'primary', size = 'regular', icon, loading = false, disabled, className = '', ...rest }: Props) {
  const blocked = disabled || loading;
  const box = /\bpx-/.test(className) ? sizing[size].box.replace(/\s?px-\d+/, '') : sizing[size].box;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      className={`flex-row items-center justify-center gap-2 active:opacity-85 ${box} ${container[variant]} ${blocked ? 'opacity-40' : ''} ${className}`}
      style={variant === 'secondary' || variant === 'inverse' ? cardShadow : undefined}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator testID="button-spinner" color={spinner[variant]} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={sizing[size].icon} color={iconColor[variant]} /> : null}
          <Text color={label[variant]} className={`font-semibold ${sizing[size].text}`}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
