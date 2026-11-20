/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#b45309',
          secondary: '#d97706',
          light: '#fef3c7',
          lighter: '#fffbeb',
        },
      },
    },
  },
  plugins: [],
}



