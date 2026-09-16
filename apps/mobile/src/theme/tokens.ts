export const colors = {
  // One deep plum for the brand, one soft gold for emphasis, warm ivory underneath.
  primary: '#4A3590',
  primaryDark: '#2A1C5C',
  primaryLight: '#EFEBF7',
  gold: '#B08A3E',
  goldLight: '#DCC07A',
  cream: '#F8F6F3', // page background: warm ivory
  surface: '#FFFFFF',
  rose: '#E8B4BC',
  roseDeep: '#B3475C',
  ink: '#1E1A2B',
  muted: '#7A7488',
  border: '#E7E2EC',
  // Quiet tinted surfaces; the deep partners are muted so nothing shouts.
  sage: '#EDF2EE',
  leaf: '#4F7D63',
  blush: '#F7ECEF',
  honey: '#F6F0E4',
  lavender: '#EFEBF7',
  sky: '#ECEFF6',
  skyDeep: '#4C5F93',
} as const;

export const fonts = {
  // One Latin family for the whole app: Montserrat, semibold for headings and regular for reading.
  display: 'Montserrat_600SemiBold',
  displayBold: 'Montserrat_700Bold',
  displayItalic: 'Montserrat_400Regular_Italic',
  sans: 'Montserrat_400Regular',
  sansMedium: 'Montserrat_500Medium',
  sansSemiBold: 'Montserrat_600SemiBold',
  numeric: 'Montserrat_600SemiBold',
  numericBold: 'Montserrat_700Bold',
  // Telugu: Montserrat has no Telugu glyphs, so Telugu text gets Noto Sans Telugu in matching weights.
  teluguBold: 'NotoSansTelugu_600SemiBold',
  teluguSans: 'NotoSansTelugu_400Regular',
  teluguSansMedium: 'NotoSansTelugu_500Medium',
} as const;

/** Barely-there lift for floating controls; cards use a hairline border instead. */
export const cardShadow = { boxShadow: '0 1px 2px rgba(30, 26, 43, 0.05)' } as const;

/** Gradient stops used by the hero cards. */
export const gradients = {
  purple: ['#3A2A78', '#4A3590'] as const,
  verse: ['#EFEBF7', '#F7ECEF', '#F6F0E4'] as const,
  welcome: ['#241848', '#3A2A78'] as const,
  song: ['#3A2A78', '#6E4C8A'] as const,
} as const;
