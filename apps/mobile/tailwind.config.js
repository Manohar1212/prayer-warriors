/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirror of src/theme/tokens.ts
      colors: {
        primary: { DEFAULT: '#7A1F2B', dark: '#5A1520', light: '#F1DFE0' },
        gold: { DEFAULT: '#B8922E', light: '#E8D08A' },
        bloom: '#F7F1E6',
        cream: '#F7F1E6',
        surface: '#FFFBF4',
        panel: '#F1E8D8',
        rose: { DEFAULT: '#E7C3C5', deep: '#7A1F2B' },
        sage: '#E4E8DA',
        leaf: '#4E6B3F',
        blush: '#F1DFE0',
        honey: '#F3E7C9',
        lavender: '#F3E7C9',
        sky: { DEFAULT: '#F3E7C9', deep: '#7A1F2B' },
        ink: '#2B1D1A',
        muted: '#7C6A5E',
        border: '#E3D6C2',
      },
      fontFamily: {
        display: ['CormorantGaramond_700Bold'],
        'display-bold': ['CormorantGaramond_700Bold'],
        'display-italic': ['Lora_400Regular_Italic'],
        sans: ['Lora_400Regular'],
        medium: ['Lora_500Medium'],
        semibold: ['Lora_600SemiBold'],
      },
    },
  },
  plugins: [],
};
