/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*/{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    ],
  theme: {
    extend: {
      colors: {
        'custom-gray-500': '#6B7280', // Define a custom gray color
      },
    },
  },
  plugins: [],
};
