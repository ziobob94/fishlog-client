// Validazione uniforme dei campi obbligatori in tutta l'app:
//  - asterisco rosso accanto all'etichetta dei campi `required`;
//  - al tocco di «Invia/Salva» niente bolla del browser: errore in rosso sotto il campo,
//    scroll e focus sul primo campo non valido;
//  - l'errore sparisce appena l'utente corregge il campo.
// Vale per ogni <form>; i form che gestiscono già la validazione da soli
// (attributo `novalidate` scritto nel template) restano com'erano.
import i18n from '../i18n/index.js'

const CONTROLS = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea'
const t = (k) => i18n.global.t(k)
let scheduled = false

const isAuto = (form) => form?.dataset.flAuto === '1'
const isVisible = (el) => !!(el.offsetParent || el.getClientRects().length)

function message(el) {
  const v = el.validity
  if (v.valueMissing) {
    if (el.type === 'checkbox') return t('validation.accept')
    if (el.type === 'file') return t('validation.file')
    return t('validation.required')
  }
  if (v.typeMismatch && el.type === 'email') return t('validation.email')
  if (v.patternMismatch) return el.title || t('validation.format')
  if (v.rangeUnderflow || v.rangeOverflow) return t('validation.range')
  if (v.tooShort) return t('validation.tooShort')
  return t('validation.format')
}

function anchor(el) {
  return el.closest('.password-input') || el
}

export function clearError(el) {
  el.removeAttribute('aria-invalid')
  const err = anchor(el).nextElementSibling
  if (err?.classList.contains('fl-error') && err.dataset.flAuto === '1') err.remove()
}

export function showError(el, text) {
  clearError(el)
  el.setAttribute('aria-invalid', 'true')
  const p = document.createElement('p')
  p.className = 'fl-error'
  p.setAttribute('role', 'alert')
  p.dataset.flAuto = '1'
  p.textContent = text
  anchor(el).insertAdjacentElement('afterend', p)
}

// Scorre fino al primo campo non valido e gli dà il focus.
export function focusFirstInvalid(root = document) {
  const el = root.querySelector('[aria-invalid="true"]')
  if (!el) return
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  try { el.focus({ preventScroll: true }) } catch { /* noop */ }
}

function onSubmit(e) {
  const form = e.target
  if (!(form instanceof HTMLFormElement) || !isAuto(form)) return
  let first = null
  form.querySelectorAll(CONTROLS).forEach(el => {
    if (el.disabled) return
    if (!isVisible(el) && el.type !== 'file' && !el.classList.contains('sr-only')) return
    if (el.checkValidity()) { clearError(el); return }
    showError(el, message(el))
    first = first || el
  })
  if (first) {
    e.preventDefault()
    e.stopImmediatePropagation()
    focusFirstInvalid(form)
  }
}

function onInput(e) {
  const el = e.target
  if (el?.getAttribute?.('aria-invalid') === 'true' && el.closest('form[data-fl-auto="1"]') && el.checkValidity()) clearError(el)
}

function scan() {
  scheduled = false
  const root = document.body
  root.querySelectorAll('form').forEach(form => {
    if (form.dataset.flAuto) return
    if (form.hasAttribute('novalidate')) { form.dataset.flAuto = '0'; return }
    form.noValidate = true
    form.dataset.flAuto = '1'
  })
  root.querySelectorAll('form[data-fl-auto="1"] [required]').forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio') return
    const label = el.labels?.[0] || el.closest('.form-group, .field')?.querySelector(':scope > label')
    if (!label || label.querySelector('.req')) return
    const s = document.createElement('span')
    s.className = 'req'
    s.setAttribute('aria-hidden', 'true')
    s.textContent = ' *'
    label.appendChild(s)
  })
}

function schedule() {
  if (scheduled) return
  scheduled = true
  // dopo formA11y, che collega le etichette ai campi
  requestAnimationFrame(() => requestAnimationFrame(scan))
}

export function setupFormValidation() {
  const root = document.body
  document.addEventListener('submit', onSubmit, true)
  document.addEventListener('input', onInput, true)
  document.addEventListener('change', onInput, true)
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true })
  schedule()
}
