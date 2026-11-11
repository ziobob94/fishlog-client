// Apertura del dettaglio da una card o da una griglia (es. tassello della bacheca → post): espansione in 320 ms con
// la View Transitions API; il tassello e la foto del dettaglio condividono lo stesso `view-transition-name`.
// Dove l'API manca (o con movimento ridotto) si usa il cambio pagina «avanti» normale: nessun errore, nessun salto.
//
//   <img :style="{ viewTransitionName: `post-${post.id}` }" …>              (sulla card/tassello E sulla foto del dettaglio)
//   await openWithTransition(() => router.push({ name: 'post', params: { id } }))
//
// Un solo elemento per volta può avere un dato nome: assegnarlo al tassello toccato prima di navigare e toglierlo dopo.
export function openWithTransition(update) {
  const reduce = document.documentElement.getAttribute('data-motion') === 'reduce'
    || (document.documentElement.getAttribute('data-motion') !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  if (!document.startViewTransition || reduce) return Promise.resolve(update())
  const t = document.startViewTransition(async () => { await update() })
  return t.finished.catch(() => {})
}
