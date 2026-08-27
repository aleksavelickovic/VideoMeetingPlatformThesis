/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        page: 'rgb(var(--color-page) / <alpha-value>)', panel: 'rgb(var(--color-panel) / <alpha-value>)', field: 'rgb(var(--color-field) / <alpha-value>)', line: 'rgb(var(--color-line) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)', brand: 'rgb(var(--color-brand) / <alpha-value>)', success: 'rgb(var(--color-success) / <alpha-value>)', danger: 'rgb(var(--color-danger) / <alpha-value>)', amber: 'rgb(var(--color-amber) / <alpha-value>)'
      },
      boxShadow: {
        panel: '0 14px 35px rgba(30, 64, 120, .09)',
        preview: '0 24px 55px rgba(30, 64, 120, .18)',
        glow: '0 0 24px rgba(37, 99, 235, .18)'
      },
      fontFamily: { sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'], mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] }
    }
  },
  plugins: []
}
