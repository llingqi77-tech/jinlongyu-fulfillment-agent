/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#F5F5F7',
        card: '#FFFFFF',
        ink: '#1D1D1F',
        muted: '#86868B',
        border: '#E5E5EA',
        accent: '#34C759',
      },
      borderRadius: {
        bubble: '16px',
        card: '20px',
        pill: '24px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(0, 0, 0, 0.06)',
        input: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
