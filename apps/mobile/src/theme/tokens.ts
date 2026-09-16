export const colors = {
  // Watercolour: warm paper, charcoal ink, sage for actions, rose for warmth, honey for a touch of light.
  primary: '#5E8A74',
  primaryDark: '#3F6E56',
  primaryLight: '#D6E8DE',
  gold: '#B8892E',
  goldLight: '#FFE0AA',
  bloom: '#FFFDF9', // the paper; stack headers match it
  cream: '#FFFDF9',
  surface: '#FFFFFF',
  panel: '#F6F2EC',
  rose: '#F4B4C8',
  roseDeep: '#9A4D68',
  ink: '#3A3330',
  muted: '#8C817B',
  border: '#E6DFD8',
  sage: '#D6E8DE',
  leaf: '#5E8A74',
  blush: '#F4D6DF',
  honey: '#FFEFC9',
  lavender: '#D6E8DE',
  sky: '#D6E8DE',
  skyDeep: '#5E8A74',
} as const;

export const fonts = {
  // Playfair Display for the greeting, verse and headings; Karla for everything you read and tap.
  display: 'PlayfairDisplay_500Medium',
  displayBold: 'PlayfairDisplay_600SemiBold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
  light: 'Karla_400Regular',
  sans: 'Karla_400Regular',
  sansMedium: 'Karla_500Medium',
  sansSemiBold: 'Karla_700Bold',
  numeric: 'Karla_700Bold',
  numericBold: 'Karla_700Bold',
  // Telugu: neither face has Telugu glyphs, so Telugu text gets Noto Sans Telugu in matching weights.
  teluguBold: 'NotoSansTelugu_600SemiBold',
  teluguSans: 'NotoSansTelugu_400Regular',
  teluguSansMedium: 'NotoSansTelugu_500Medium',
} as const;

/** A whisper of lift for floating controls; panels rely on a hairline instead. */
export const cardShadow = { boxShadow: '0 2px 10px rgba(58, 51, 48, 0.06)' } as const;

/** Gradient stops used by the hero cards. */
export const gradients = {
  purple: ['#5E8A74', '#7FA98F'] as const,
  verse: ['#F4D6DF', '#D6E8DE', '#FFEFC9'] as const,
  welcome: ['#FFFDF9', '#FFFDF9', '#FFFDF9'] as const,
  song: ['#5E8A74', '#C98AA0'] as const,
} as const;
