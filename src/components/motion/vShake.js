// Scuotimento breve (280 ms, una volta) per un campo in errore. Lo scuotimento si ripete a ogni invio con errore.
// Uso: <div v-shake="errorCount"> <input … /> </div>   con errorCount che aumenta a ogni validazione fallita.
// Con movimento ridotto l'animazione è disattivata dal CSS (resta il bordo rosso e il messaggio). Il messaggio d'errore
// deve avere lo spazio già riservato (min-height di una riga) per non spostare il layout.
export const vShake = {
  updated(el, { value, oldValue }) {
    if (!value || value === oldValue) return
    el.classList.remove('m-shake')
    void el.offsetWidth            // riavvia l'animazione
    el.classList.add('m-shake')
  },
  beforeUnmount(el) { el.classList.remove('m-shake') },
}
