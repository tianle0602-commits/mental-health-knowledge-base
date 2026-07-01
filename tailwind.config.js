/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        warm: {
          50: "#FDF6EE",
          100: "#FBF0E0",
          200: "#F5E1C8",
          500: "#D4946A",
          600: "#C17D52",
          700: "#A8653E",
        },
        sage: {
          50: "#E8EFE9",
          100: "#D4E3D5",
          200: "#B5CFB7",
          500: "#7DA08A",
          600: "#6A8F78",
          700: "#577A65",
        },
        ink: {
          50: "#8B7355",
          100: "#6B5A44",
          500: "#4A3728",
          700: "#3A2A1E",
          900: "#2A1D14",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};