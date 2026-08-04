/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#faf7f2',
        ink: '#2d2a26',
      },
      boxShadow: {
        card: '0 1px 3px rgba(45, 42, 38, 0.08), 0 4px 14px rgba(45, 42, 38, 0.06)',
        sheet: '0 -8px 30px rgba(45, 42, 38, 0.15)',
      },
    },
  },
  plugins: [],
};
