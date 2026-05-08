/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:       '#1a2d6b',
          'navy-mid': '#243685',
          'navy-lt':  '#2d4a9e',
          blue:       '#1d4ed8',
          'blue-lt':  '#3b6ef5',
          red:        '#dc2626',
          'red-lt':   '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
