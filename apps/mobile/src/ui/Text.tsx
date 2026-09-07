import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export type TextVariant = 'display' | 'title' | 'body' | 'muted' | 'label';

const variantClass: Record<TextVariant, string> = {
  display: 'font-display text-3xl text-ink',
  title: 'font-semibold text-lg text-ink',
  body: 'font-sans text-base text-ink leading-6',
  muted: 'font-sans text-sm text-muted',
  label: 'font-medium text-sm text-ink',
};

export type TextProps = RNTextProps & { variant?: TextVariant; className?: string };

export function Text({ variant = 'body', className = '', ...rest }: TextProps) {
  return <RNText className={`${variantClass[variant]} ${className}`} {...rest} />;
}
