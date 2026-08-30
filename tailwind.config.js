/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens — ver src/index.css. Escuro por omissão, claro quando o SO preferir.
        bg:      'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2:       'var(--surface-2)',
        },
        border:  'var(--border)',
        ink: {
          DEFAULT: 'var(--text)',
          secondary: 'var(--text-2)',
          muted:     'var(--text-3)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          solid:   'var(--accent-solid)',
          soft:    'var(--accent-soft)',
          ink:     'var(--accent-ink)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft:    'var(--danger-soft)',
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
