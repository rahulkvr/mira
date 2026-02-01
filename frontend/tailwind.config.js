/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#18181b',
        'background-light': '#FFF9F2',
        'background-dark': '#121212',
        'card-light': '#FFFFFF',
        'card-dark': '#1e1e1e',
        accent: '#FCD34D',
        mint: '#D1FAE5',
        pinky: '#FCE7F3',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '3rem',
      },
      boxShadow: {
        'ios': '0 4px 24px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
