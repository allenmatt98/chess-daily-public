/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-90': 'rgba(var(--color-primary-rgb), 0.9)',
        'primary/50': 'rgba(var(--color-primary-rgb), 0.5)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        border: 'var(--color-border)',
      }
    },
  },
  plugins: [],
};