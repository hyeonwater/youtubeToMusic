/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        youtube: {
          red: '#FF0000',
          dark: '#0F0F0F',
          light: '#F9F9F9',
        },
        apple: {
          red: '#ff1744',
          pink: '#e91e63',
          rose: '#f50057',
        }
      }
    },
  },
  plugins: [],
} 