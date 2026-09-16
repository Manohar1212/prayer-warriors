export const colors = {
  // Warm and traditional: parchment, deep burgundy, gold, dark ink.
  primary: '#7A1F2B',
  primaryDark: '#5A1520',
  primaryLight: '#F1DFE0',
  gold: '#B8922E',
  goldLight: '#E8D08A',
  bloom: '#F7F1E6', // the parchment; stack headers match it
  cream: '#F7F1E6',
  surface: '#FFFBF4',
  panel: '#F1E8D8',
  rose: '#E7C3C5',
  roseDeep: '#7A1F2B',
  ink: '#2B1D1A',
  muted: '#7C6A5E',
  border: '#E3D6C2',
  sage: '#E4E8DA',
  leaf: '#4E6B3F',
  blush: '#F1DFE0',
  honey: '#F3E7C9',
  lavender: '#F3E7C9',
  sky: '#F3E7C9',
  skyDeep: '#7A1F2B',
} as const;

export const fonts = {
  // Cormorant Garamond for headings, Lora for reading; both serifs, as a prayer book would be set.
  display: 'CormorantGaramond_700Bold',
  displayBold: 'CormorantGaramond_700Bold',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
  light: 'Lora_400Regular',
  sans: 'Lora_400Regular',
  sansMedium: 'Lora_500Medium',
  sansSemiBold: 'Lora_600SemiBold',
  sansItalic: 'Lora_400Regular_Italic',
  numeric: 'Lora_600SemiBold',
  numericBold: 'Lora_600SemiBold',
  // Telugu: Noto Serif Telugu, so Telugu keeps the same book-like voice.
  teluguBold: 'NotoSerifTelugu_700Bold',
  teluguSans: 'NotoSerifTelugu_400Regular',
  teluguSansMedium: 'NotoSerifTelugu_500Medium',
} as const;

/** A whisper of lift for floating controls; panels rely on a gold hairline instead. */
export const cardShadow = { boxShadow: '0 2px 10px rgba(43, 29, 26, 0.08)' } as const;

/** Gradient stops used by the hero cards. */
export const gradients = {
  purple: ['#7A1F2B', '#5A1520'] as const,
  verse: ['#F3E7C9', '#F1DFE0', '#FFFBF4'] as const,
  welcome: ['#F7F1E6', '#F7F1E6', '#F7F1E6'] as const,
  song: ['#7A1F2B', '#B8922E'] as const,
} as const;
