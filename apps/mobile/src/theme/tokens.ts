export const colors = {
  // Soft bloom: a friendly violet for actions, rose for warmth, pastel tiles, and a peach-to-lavender page.
  primary: '#6D4FD1',
  primaryDark: '#4A3590',
  primaryLight: '#E4DDF8',
  // Gold, leaf and sky now resolve to the violet family so the app reads as one colour plus rose.
  gold: '#6D4FD1',
  goldLight: '#B9A6F0',
  bloom: '#FBE9E1', // top of the page gradient; stack headers match it
  cream: '#FFFFFF',
  surface: '#FFFFFF',
  panel: '#F4F0F9',
  rose: '#F4B8C8',
  roseDeep: '#C6749A',
  ink: '#2B2440',
  muted: '#7A7090',
  border: '#EEE9F5',
  sage: '#E4DDF8',
  leaf: '#6D4FD1',
  blush: '#FBDDE6',
  honey: '#E4DDF8',
  lavender: '#E4DDF8',
  sky: '#E4DDF8',
  skyDeep: '#6D4FD1',
} as const;

export const fonts = {
  // Nunito: rounded and friendly, extra-bold for headings, regular for reading.
  display: 'Nunito_800ExtraBold',
  displayBold: 'Nunito_800ExtraBold',
  displayItalic: 'Nunito_600SemiBold_Italic',
  light: 'Nunito_400Regular',
  sans: 'Nunito_400Regular',
  sansMedium: 'Nunito_600SemiBold',
  sansSemiBold: 'Nunito_700Bold',
  numeric: 'Nunito_800ExtraBold',
  numericBold: 'Nunito_800ExtraBold',
  // Telugu: Nunito has no Telugu glyphs, so Telugu text gets Noto Sans Telugu in matching weights.
  teluguBold: 'NotoSansTelugu_700Bold',
  teluguSans: 'NotoSansTelugu_400Regular',
  teluguSansMedium: 'NotoSansTelugu_500Medium',
} as const;

/** The soft lift under white cards and floating controls. */
export const cardShadow = { boxShadow: '0 10px 30px rgba(80, 60, 140, 0.10)' } as const;

/** Gradient stops used by the hero cards. */
export const gradients = {
  purple: ['#6D4FD1', '#9B7BE8'] as const,
  verse: ['#E4DDF8', '#FBDDE6', '#FBEBCF'] as const,
  welcome: ['#FBE9E1', '#EEE6FA', '#FFFFFF'] as const,
  song: ['#6D4FD1', '#C6749A'] as const,
} as const;
