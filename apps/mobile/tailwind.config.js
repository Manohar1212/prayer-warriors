/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirror of src/theme/tokens.ts
      colors: {
        primary: { DEFAULT: '#5E8A74', dark: '#3F6E56', light: '#D6E8DE' },
        gold: { DEFAULT: '#B8892E', light: '#FFE0AA' },
        bloom: '#FFFDF9',
        cream: '#FFFDF9',
        surface: '#FFFFFF',
        panel: '#F6F2EC',
        rose: { DEFAULT: '#F4B4C8', deep: '#9A4D68' },
        sage: '#D6E8DE',
        leaf: '#5E8A74',
        blush: '#F4D6DF',
        honey: '#FFEFC9',
        lavender: '#D6E8DE',
        sky: { DEFAULT: '#D6E8DE', deep: '#5E8A74' },
        ink: '#3A3330',
        muted: '#8C817B',
        border: '#E6DFD8',
      },
      fontFamily: {
        display: ['PlayfairDisplay_400Regular_Italic'],
        'display-bold': ['PlayfairDisplay_600SemiBold'],
        'display-italic': ['PlayfairDisplay_400Regular_Italic'],
        sans: ['Karla_400Regular'],
        medium: ['Karla_500Medium'],
        semibold: ['Karla_700Bold'],
      },
    },
  },
  plugins: [],
};
