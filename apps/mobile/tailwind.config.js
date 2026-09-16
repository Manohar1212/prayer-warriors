/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirror of src/theme/tokens.ts
      colors: {
        primary: { DEFAULT: '#1E3A5F', dark: '#152C49', light: '#E3EEFA' },
        gold: { DEFAULT: '#E9A23B', light: '#FDF0D8' },
        bloom: '#FFFFFF',
        cream: '#FFFFFF',
        surface: '#FFFFFF',
        panel: '#F5F7FA',
        rose: { DEFAULT: '#FBE4EC', deep: '#D6336C' },
        sage: '#E6F4EA',
        leaf: '#2E9E5B',
        blush: '#FBE4EC',
        honey: '#FDF0D8',
        lavender: '#EEE6FA',
        violet: '#7C4DCC',
        sky: { DEFAULT: '#E3EEFA', deep: '#2F6FCB' },
        ink: '#111827',
        muted: '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: {
        display: ['Inter_700Bold'],
        'display-bold': ['Inter_700Bold'],
        'display-italic': ['Inter_400Regular_Italic'],
        sans: ['Inter_400Regular'],
        medium: ['Inter_600SemiBold'],
        semibold: ['Inter_600SemiBold'],
      },
    },
  },
  plugins: [],
};
