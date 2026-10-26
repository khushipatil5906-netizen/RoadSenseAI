/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070d18',
          900: '#0c1527',
          800: '#14223d',
          700: '#1e335b',
          600: '#2b477d',
        },
        civic: {
          blue: '#1d4ed8',
          sky: '#0284c7',
          amber: '#d97706',
          red: '#dc2626',
          emerald: '#059669',
          slate: '#f8fafc',
          card: '#ffffff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
