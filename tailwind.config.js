/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a12',
          900: '#0f0f1a',
          850: '#141420',
          800: '#1a1a2e',
          750: '#1e1e38',
          700: '#252540',
          600: '#3a3a5c',
          500: '#6b6b9a',
          400: '#9090c0',
          300: '#b8b8d8',
          200: '#d4d4e8',
          100: '#e8e8f0',
        },
        indigo: {
          600: '#4f46e5',
          500: '#6366f1',
          400: '#818cf8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    }
  },
  plugins: []
}
