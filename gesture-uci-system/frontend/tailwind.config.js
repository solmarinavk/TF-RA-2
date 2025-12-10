/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          red: '#EF4444',
          orange: '#F59E0B',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          green: '#10B981',
          indigo: '#6366F1',
          pink: '#EC4899',
          amber: '#F97316',
          teal: '#14B8A6',
          lime: '#84CC16'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        }
      }
    },
  },
  plugins: [],
}
