/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-red': '#FF644E',
        'custom-blue': '#00A2FF',
        'custom-white': '#FFFFFF',
      }
    },
  },
  plugins: [],
}
