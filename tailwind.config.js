/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        fresh: { DEFAULT: '#16A34A', dark: '#15803D', light: '#DCFCE7' },
        amberwarm: { DEFAULT: '#F59E0B', light: '#FEF3C7' },
        labteal: { DEFAULT: '#0D9488', dark: '#0F766E', light: '#CCFBF1' },
        cream: '#FFFBEB',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Outfit"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(22,163,74,0.18)',
        lift: '0 12px 32px -8px rgba(13,148,136,0.25)',
      },
    },
  },
  plugins: [],
};
