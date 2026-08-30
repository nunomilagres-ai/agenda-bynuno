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
          50:  '#EAF1FF',
          100: '#D6E4FF',
          200: '#AFC9FA',
          300: '#7FA4F0',
          400: '#4A7BE0',
          500: '#2E5FCB',
          600: '#264FAD',
          700: '#1D3D87',
          800: '#152C60',
          900: '#0C1A38',
        },
        surface: {
          bg:     '#F5F7FB',
          card:   '#FFFFFF',
          border: '#E2E6EF',
          muted:  '#EEF1F8',
        },
        ink: {
          DEFAULT: '#131A2A',
          secondary: '#4B5567',
          muted:     '#8A93A6',
          faint:     '#C3C9D6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
}
