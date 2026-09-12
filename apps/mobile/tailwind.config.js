/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirror of src/theme/tokens.ts
      colors: {
        primary: { DEFAULT: '#5B3FA6', dark: '#3E2A7C', light: '#EDE7FA' },
        gold: { DEFAULT: '#A9771F', light: '#E7C46A' },
        cream: '#F7F5FB',
        surface: '#FFFFFF',
        rose: { DEFAULT: '#F2A7B1', deep: '#D63C50' },
        sage: '#E3F3E9',
        leaf: '#2E9E5B',
        blush: '#FCE5E9',
        honey: '#F9EFD9',
        lavender: '#EDE7FA',
        sky: { DEFAULT: '#E4EEFB', deep: '#3C6FC9' },
        ink: '#1F1B2E',
        muted: '#6F6A80',
        border: '#E9E5F2',
      },
      fontFamily: {
        display: ['PlayfairDisplay_600SemiBold'],
        'display-bold': ['PlayfairDisplay_700Bold'],
        'display-italic': ['PlayfairDisplay_400Regular_Italic'],
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
      },
    },
  },
  plugins: [],
};
