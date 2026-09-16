export const colors = {
  // Clean and modern: white, deep navy for actions, pastel tiles with saturated icons.
  primary: '#1E3A5F',
  primaryDark: '#152C49',
  primaryLight: '#E3EEFA',
  gold: '#E9A23B',
  goldLight: '#FDF0D8',
  bloom: '#FFFFFF',
  cream: '#FFFFFF',
  surface: '#FFFFFF',
  panel: '#F5F7FA',
  rose: '#FBE4EC',
  roseDeep: '#D6336C',
  ink: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  sage: '#E6F4EA',
  leaf: '#2E9E5B',
  blush: '#FBE4EC',
  honey: '#FDF0D8',
  lavender: '#EEE6FA',
  violet: '#7C4DCC',
  sky: '#E3EEFA',
  skyDeep: '#2F6FCB',
} as const;

export const fonts = {
  // Inter throughout: bold for headings, regular for reading, semibold for labels and buttons.
  display: 'Inter_700Bold',
  displayBold: 'Inter_700Bold',
  displayItalic: 'Inter_400Regular_Italic',
  light: 'Inter_400Regular',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_600SemiBold',
  sansSemiBold: 'Inter_600SemiBold',
  sansItalic: 'Inter_400Regular_Italic',
  numeric: 'Inter_700Bold',
  numericBold: 'Inter_700Bold',
  // Telugu: Inter has no Telugu glyphs, so Telugu text gets Noto Sans Telugu in matching weights.
  teluguBold: 'NotoSansTelugu_700Bold',
  teluguSans: 'NotoSansTelugu_400Regular',
  teluguSansMedium: 'NotoSansTelugu_500Medium',
} as const;

/** The light lift under white cards. */
export const cardShadow = { boxShadow: '0 2px 8px rgba(17, 24, 39, 0.06)' } as const;

/** Gradient stops used by the hero cards. */
export const gradients = {
  purple: ['#1E3A5F', '#2F6FCB'] as const,
  verse: ['#E3EEFA', '#EEE6FA', '#FFFFFF'] as const,
  welcome: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
  song: ['#7C4DCC', '#2F6FCB'] as const,
} as const;
