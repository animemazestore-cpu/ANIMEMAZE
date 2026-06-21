/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        surface: "#111827",
        primary: {
          DEFAULT: "#8B5CF6",
          dark: "#7C3AED",
          light: "#A78BFA",
        },
        secondary: {
          DEFAULT: "#06B6D4",
          dark: "#0891B2",
          light: "#22D3EE",
        },
        success: "#22C55E",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-primary': '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
        'glass-secondary': '0 8px 32px 0 rgba(6, 182, 212, 0.15)',
      },
      backdropBlur: {
        'glass': '8px',
      }
    },
  },
  plugins: [],
}
