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
        // צבע המבטא (ענבר) מוגדר כמשתנה כדי שיהיה בהיר יותר במצב כהה
        amber: {
          400: 'rgb(var(--c-accent-lo) / <alpha-value>)',
          500: 'rgb(var(--c-accent) / <alpha-value>)',
          600: 'rgb(var(--c-accent-hi) / <alpha-value>)',
        },
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
        card: '0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.07)',
        sheet: '0 -10px 40px rgba(0, 0, 0, 0.22)',
      },
      borderRadius: {
        card: '22px',
      },
      transitionTimingFunction: {
        // עקומות חזקות במקום ה-ease המובנה החלש
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
