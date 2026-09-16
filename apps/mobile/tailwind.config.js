/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirror of src/theme/tokens.ts
      colors: {
        primary: { DEFAULT: '#6D4FD1', dark: '#4A3590', light: '#E4DDF8' },
        gold: { DEFAULT: '#6D4FD1', light: '#B9A6F0' },
        bloom: '#FBE9E1',
        cream: '#FFFFFF',
        surface: '#FFFFFF',
        panel: '#F4F0F9',
        rose: { DEFAULT: '#F4B8C8', deep: '#C6749A' },
        sage: '#E4DDF8',
        leaf: '#6D4FD1',
        blush: '#FBDDE6',
        honey: '#E4DDF8',
        lavender: '#E4DDF8',
        sky: { DEFAULT: '#E4DDF8', deep: '#6D4FD1' },
        ink: '#2B2440',
        muted: '#7A7090',
        border: '#EEE9F5',
      },
      fontFamily: {
        display: ['Nunito_800ExtraBold'],
        'display-bold': ['Nunito_800ExtraBold'],
        'display-italic': ['Nunito_600SemiBold_Italic'],
        sans: ['Nunito_400Regular'],
        medium: ['Nunito_600SemiBold'],
        semibold: ['Nunito_700Bold'],
      },
    },
  },
  plugins: [],
};
