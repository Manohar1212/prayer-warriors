export const colors = {
  primary: '#5B3FA6',
  primaryDark: '#3E2A7C',
  primaryLight: '#EDE7FA',
  gold: '#A9771F',
  goldLight: '#E7C46A',
  cream: '#F7F5FB', // page background: a lavender-tinted off-white
  surface: '#FFFFFF',
  rose: '#F2A7B1',
  roseDeep: '#D63C50',
  ink: '#1F1B2E',
  muted: '#6F6A80',
  border: '#E9E5F2',
  // Tinted surfaces
  sage: '#E3F3E9',
  leaf: '#2E9E5B',
  blush: '#FCE5E9',
  honey: '#F9EFD9',
  lavender: '#EDE7FA',
  sky: '#E4EEFB',
  skyDeep: '#3C6FC9',
} as const;

export const fonts = {
  display: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  // Telugu: Playfair and Inter have no Telugu glyphs, so Telugu text gets matching Noto faces.
  teluguSerif: 'NotoSerifTelugu_600SemiBold',
  teluguSerifRegular: 'NotoSerifTelugu_400Regular',
  teluguSans: 'NotoSansTelugu_400Regular',
  teluguSansMedium: 'NotoSansTelugu_500Medium',
} as const;

/** Soft shadow for white cards on the lavender page. */
export const cardShadow = { boxShadow: '0 4px 18px rgba(62, 42, 124, 0.07)' } as const;

/** Gradient stops used by the hero cards. */
export const gradients = {
  purple: ['#5B3FA6', '#7A5BD1'] as const,
  verse: ['#EDE7FA', '#FCE5E9', '#F9EFD9'] as const,
  welcome: ['#2A1C5C', '#4A338F', '#6B4CC0'] as const,
  song: ['#6B4CC0', '#C86B9A'] as const,
} as const;
