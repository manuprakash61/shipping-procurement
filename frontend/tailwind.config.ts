import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde8ff',
          200: '#c3d5ff',
          300: '#9ab8ff',
          400: '#6a92ff',
          500: '#3d6aff',
          600: '#1a45f5',
          700: '#1233e0',
          800: '#1429b5',
          900: '#16278f',
          950: '#0f1a5e',
        },
        dark: {
          50: '#f8f9fc',
          100: '#f0f2f8',
          200: '#dde2f0',
          300: '#c2cade',
          400: '#9aa4c2',
          500: '#7480a8',
          600: '#586190',
          700: '#464e78',
          800: '#3b4264',
          900: '#1a1a2e',
          950: '#0f0f1a',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
