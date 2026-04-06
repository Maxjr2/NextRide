import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // we use .hc class for high-contrast, not system dark
  theme: {
    extend: {
      fontFamily: {
        // Atkinson Hyperlegible is dyslexia-friendly — loaded via index.html
        sans: ['"Atkinson Hyperlegible"', 'Verdana', 'sans-serif'],
      },
      colors: {
        // Design tokens matching the POC
        offer: {
          DEFAULT: '#1a6fb5',
          bg: '#e8f2fb',
          border: '#b3d4ed',
        },
        request: {
          DEFAULT: '#c26a1a',
          bg: '#fdf0e3',
          border: '#e8c9a5',
        },
        accent: {
          DEFAULT: '#2d7d46',
          bg: '#e6f4ec',
        },
        surface: '#ffffff',
        app: '#faf8f5',
        muted: '#767676',
        danger: {
          DEFAULT: '#a33030',
          bg: '#fdeaea',
        },
      },
      borderRadius: {
        card: '14px',
        btn: '8px',
      },
      minHeight: {
        touch: '48px',   // WCAG minimum touch target
        'touch-lg': '56px', // primary actions
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-lg': '0 4px 20px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
