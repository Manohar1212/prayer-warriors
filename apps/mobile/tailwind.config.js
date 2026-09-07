/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirror of src/theme/tokens.ts
      colors: {
        primary: { DEFAULT: '#173E32', dark: '#0E2A22' },
        gold: { DEFAULT: '#B98224', light: '#E7C46A' },
        cream: '#FAF7F0',
        surface: '#FFFFFF',
        rose: { DEFAULT: '#D99A9A', deep: '#A8514D' },
        sage: '#DCE9DF',
        blush: '#F6E2DE',
        honey: '#F6E9CB',
        ink: '#202521',
        muted: '#70756F',
        border: '#E6E0D5',
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
