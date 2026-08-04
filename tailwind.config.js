/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
      },
      // צבעי הבסיס מוגדרים כמשתני CSS כדי שמצב כהה יעבוד בכל האפליקציה אוטומטית
      colors: {
        cream: 'rgb(var(--c-cream) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        gray: {
          50: 'rgb(var(--c-g50) / <alpha-value>)',
          100: 'rgb(var(--c-g100) / <alpha-value>)',
          200: 'rgb(var(--c-g200) / <alpha-value>)',
          300: 'rgb(var(--c-g300) / <alpha-value>)',
          400: 'rgb(var(--c-g400) / <alpha-value>)',
          500: 'rgb(var(--c-g500) / <alpha-value>)',
          600: 'rgb(var(--c-g600) / <alpha-value>)',
          700: 'rgb(var(--c-g700) / <alpha-value>)',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 14px rgba(0, 0, 0, 0.06)',
        sheet: '0 -8px 30px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};
