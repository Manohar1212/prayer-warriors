/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirror of src/theme/tokens.ts
      colors: {
        primary: { DEFAULT: '#4A3590', dark: '#2A1C5C', light: '#EFEBF7' },
        gold: { DEFAULT: '#B08A3E', light: '#DCC07A' },
        cream: '#FFFFFF',
        surface: '#FFFFFF',
        panel: '#F7F5F2',
        rose: { DEFAULT: '#E8B4BC', deep: '#B3475C' },
        sage: '#EDF2EE',
        leaf: '#4F7D63',
        blush: '#F7ECEF',
        honey: '#F6F0E4',
        lavender: '#EFEBF7',
        sky: { DEFAULT: '#ECEFF6', deep: '#4C5F93' },
        ink: '#1E1A2B',
        muted: '#7A7488',
        border: '#ECE8E3',
      },
      fontFamily: {
        display: ['Montserrat_600SemiBold'],
        'display-bold': ['Montserrat_700Bold'],
        'display-italic': ['Montserrat_400Regular_Italic'],
        sans: ['Montserrat_400Regular'],
        medium: ['Montserrat_500Medium'],
        semibold: ['Montserrat_600SemiBold'],
      },
    },
  },
  plugins: [],
};
