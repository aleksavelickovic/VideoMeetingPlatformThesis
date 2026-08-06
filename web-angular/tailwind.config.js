/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        page: '#0d1119', panel: '#141c2b', field: '#121b2b', line: '#24324a',
        muted: '#6980a5', brand: '#3d7ff2', success: '#22c55e', danger: '#ff4d5a', amber: '#f59e0b'
      },
      boxShadow: { panel: '0 20px 50px rgba(0,0,0,.22)', glow: '0 0 24px rgba(61,127,242,.28)' },
      fontFamily: { sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'], mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] }
    }
  },
  plugins: []
}
