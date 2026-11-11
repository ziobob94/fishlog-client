// Da fondere in tailwind.config.js → theme.extend
export default {
  colors: {
    'ocean-text':   'rgb(var(--color-ocean-text) / <alpha-value>)',
    'sand-text':    'rgb(var(--color-sand-text) / <alpha-value>)',
    'danger-text':  'rgb(var(--color-danger-text) / <alpha-value>)',
    'success-text': 'rgb(var(--color-success-text) / <alpha-value>)',
    'on-primary':   'rgb(var(--color-on-primary) / <alpha-value>)',
    'sea-deep':     'rgb(var(--color-sea-deep) / <alpha-value>)',
  },
  borderRadius: {
    sm: '12px',      // era 8px: pulsanti e input
    lg: '20px',      // era 14px: card
    xl: '24px',      // card principali, riquadri hero
    signature: '24px 24px 24px 8px',
  },
}

// Tipografia: aggiungi in theme.extend.fontFamily
// fontFamily: {
//   display: ['Fraunces', 'Georgia', 'serif'],   // tutti i titoli (peso 700-800); mai su bottoni, chip, nav, testo corrente
//   sans: ['Manrope', 'system-ui', 'sans-serif'], // testi e interfaccia
//   mono: ['JetBrains Mono', 'monospace']         // numeri, coordinate, misure
// }
