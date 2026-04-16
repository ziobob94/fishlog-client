/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        ink:          '#0d1117',
        'ink-light':  '#1a2332',
        surface:      '#111827',
        'surface-2':  '#1f2d3d',
        border:       '#2a3f55',
        'border-light': '#3a5470',
        ocean:        '#0ea5e9',
        'ocean-dark': '#0369a1',
        sand:         '#f59e0b',
        'sand-light': '#fcd34d',
        foam:         '#e2e8f0',
        muted:        '#64748b',
        danger:       '#ef4444',
        success:      '#22c55e',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        lg: '14px',
      },
      spacing: {
        '4.5': '18px',
        '5.5': '22px',
        '13':  '52px',
        '15':  '60px',
      }
    }
  },
  plugins: []
}