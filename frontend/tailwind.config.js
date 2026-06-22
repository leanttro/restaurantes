/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bordeaux: {
          50: '#fbf2f2',
          100: '#f3dfe1',
          200: '#e3b4ba',
          300: '#cf8590',
          400: '#a8485a',
          500: '#852838',
          600: '#6b1e2f',
          700: '#561826',
          800: '#41121c',
          900: '#2c0c13',
        },
        sand: {
          50: '#fdfbf7',
          100: '#f7f1e8',
          200: '#efe5d3',
          300: '#e2d3b5',
          400: '#cdb888',
        },
        ink: {
          400: '#766e63',
          600: '#46403a',
          800: '#2a2521',
          900: '#1f1b16',
        },
        gold: {
          400: '#dab85c',
          500: '#c99a2e',
          600: '#a87c1f',
        },
        sage: {
          500: '#5b7553',
          600: '#48603f',
        },
        rust: {
          500: '#b5502f',
          600: '#9a3f23',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-jakarta)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        ticket:
          '0 1px 0 rgba(31,27,22,0.04), 0 8px 24px -8px rgba(43,12,19,0.18)',
      },
      opacity: {
        8: '0.08',
        15: '0.15',
        40: '0.4',
        60: '0.6',
        70: '0.7',
        80: '0.8',
        95: '0.95',
      },
      backgroundImage: {
        perforation:
          'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(43,12,19,0.18) 6px, rgba(43,12,19,0.18) 8px)',
      },
    },
  },
  plugins: [],
}
