const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './new-components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Josefin Sans"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        theme: {
          primary: '#4B5563',
          light: '#f7f7f7',
          dark: '#151622',
          'dark-container': '#232734',
          success: '#52C41A',
          error: '#FF4D4F',
          warning: '#FAAD14',
        },
        gradientL: '#E5E7EB',
        gradientR: '#9CA3AF',
      },
      backgroundColor: {
        bar: '#F3F4F6',
      },
      textColor: {
        default: '#4B5563',
      },
      backgroundImage: {
        'gradient-light': 'linear-gradient(135deg, #f7f7f7 0%, #F3F4F6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #151622 0%, #232734 100%)',
        'button-gradient': 'linear-gradient(to right, theme("colors.gradientL"), theme("colors.gradientR"))',
      },
      keyframes: {
        pulse1: {
          '0%, 100%': { transform: 'scale(1)', backgroundColor: '#bdc0c4' },
          '33.333%': { transform: 'scale(1.5)', backgroundColor: '#525964' },
        },
        pulse2: {
          '0%, 100%': { transform: 'scale(1)', backgroundColor: '#bdc0c4' },
          '33.333%': { transform: 'scale(1.0)', backgroundColor: '#bdc0c4' },
          '66.666%': { transform: 'scale(1.5)', backgroundColor: '#525964' },
        },
        pulse3: {
          '0%, 66.666%': { transform: 'scale(1)', backgroundColor: '##bdc0c4' },
          '100%': { transform: 'scale(1.5)', backgroundColor: '#525964' },
        },
      },
      animation: {
        pulse1: 'pulse1 1.2s infinite',
        pulse2: 'pulse2 1.2s infinite',
        pulse3: 'pulse3 1.2s infinite',
      },
    },
  },
  important: true,
  darkMode: 'class',
  /**
   * @see https://www.tailwindcss-animated.com/configurator.html
   */
  plugins: [require('tailwindcss-animated')],
};
