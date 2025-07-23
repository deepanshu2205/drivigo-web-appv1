/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffbd40', // Your new brand color
        'primary-hover': '#e6a22a', // A slightly darker version for hover effects
      }
    },
  },
  plugins: [],
}