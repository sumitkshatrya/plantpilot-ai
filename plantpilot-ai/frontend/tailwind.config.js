/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: '#0A0F1D',
          panel: '#111827',
          surface: '#1F2937',
          border: '#374151',
          teal: '#0D9488',
          tealLight: '#14B8A6',
          tealGlow: '#2DD4BF',
          accent: '#0284C7',
          warning: '#F59E0B',
          danger: '#EF4444',
          success: '#10B981',
          textMuted: '#9CA3AF',
          textPrimary: '#F9FAFB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
