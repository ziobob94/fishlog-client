/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        ink:          'rgb(var(--color-ink) / <alpha-value>)',
        'ink-light':  'rgb(var(--color-ink-light) / <alpha-value>)',
        surface:      'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2':  'rgb(var(--color-surface-2) / <alpha-value>)',
        border:       'rgb(var(--color-border) / <alpha-value>)',
        'border-light': 'rgb(var(--color-border-light) / <alpha-value>)',
        ocean:        'rgb(var(--color-ocean) / <alpha-value>)',
        'ocean-dark': 'rgb(var(--color-ocean-dark) / <alpha-value>)',
        sand:         'rgb(var(--color-sand) / <alpha-value>)',
        'sand-light': 'rgb(var(--color-sand-light) / <alpha-value>)',
        foam:         'rgb(var(--color-foam) / <alpha-value>)',
        muted:        'rgb(var(--color-muted) / <alpha-value>)',
        danger:       'rgb(var(--color-danger) / <alpha-value>)',
        success:      'rgb(var(--color-success) / <alpha-value>)',
        'ocean-text':   'rgb(var(--color-ocean-text) / <alpha-value>)',
        'sand-text':    'rgb(var(--color-sand-text) / <alpha-value>)',
        'danger-text':  'rgb(var(--color-danger-text) / <alpha-value>)',
        'success-text': 'rgb(var(--color-success-text) / <alpha-value>)',
        'on-primary':   'rgb(var(--color-on-primary) / <alpha-value>)',
        'sea-deep':     'rgb(var(--color-sea-deep) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '12px',
        lg: '20px',
        xl: '24px',
        signature: '24px 24px 24px 8px',
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