/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-ink)',
        'paper-canvas': 'var(--color-paper-canvas)',
        'off-black': 'var(--color-off-black)',
        'pale-stone': 'var(--color-pale-stone)',
        'whisper-gray': 'var(--color-whisper-gray)',
        'atmosphere-wash': 'var(--color-atmosphere-wash)',
        'subtle-link': 'var(--color-subtle-link)',
        'faint-text': 'var(--color-faint-text)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        'segment-track': 'var(--color-segment-track)',
      },
      fontFamily: {
        ui: 'var(--font-ui)',
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        bubble: 'var(--radius-bubble)',
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)',
        button: 'var(--radius-button)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        input: 'var(--shadow-input)',
        md: 'var(--shadow-md)',
      },
    },
  },
  plugins: [],
}
