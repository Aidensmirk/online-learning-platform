/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4CAF50", 
        secondary: "#FF9800", 
        accent: "#03A9F4",
        background: "#F5F5F5", 
        textPrimary: "#212121",
        textSecondary: "#757575", 
      },
    },
  },
  plugins: [],
}
