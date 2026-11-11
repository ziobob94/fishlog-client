<template>
  <!-- Montare una volta in App.vue. Entrata 200 ms --ease-enter dall'alto (dal basso se c'è un'azione), uscita 120 ms --ease-exit. -->
  <Teleport to="body">
    <div class="toast-zone toast-zone-top" aria-live="off">
      <TransitionGroup name="toast-top" tag="div" class="toast-stack">
        <ToastItem v-for="t in top" :key="t.id" :t="t" />
      </TransitionGroup>
    </div>
    <div class="toast-zone toast-zone-bottom" aria-live="off">
      <TransitionGroup name="toast-bottom" tag="div" class="toast-stack">
        <ToastItem v-for="t in bottom" :key="t.id" :t="t" />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, h } from 'vue'
import { toastState, pause, resume, dismiss } from './useToast.js'

const top = computed(() => toastState.items.filter(t => t.position === 'top'))
const bottom = computed(() => toastState.items.filter(t => t.position === 'bottom'))

const ICON = {
  success: 'm5 12 5 5 9-10', error: 'M12 8v5M12 16.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  warning: 'M12 3.5 2.5 20h19L12 3.5ZM12 10v4.5M12 17.5h.01', info: 'M12 17v-5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
}
// Icona + testo + colore: lo stato non è mai affidato al solo colore. Errore = role="alert", gli altri role="status".
const ToastItem = {
  props: { t: Object },
  setup: (p) => () => h('div', {
    class: ['toast', `toast-${p.t.kind}`], role: p.t.kind === 'error' ? 'alert' : 'status',
    onMouseenter: () => pause(p.t), onMouseleave: () => resume(p.t), onFocusin: () => pause(p.t), onFocusout: () => resume(p.t),
    onTouchstart: () => pause(p.t), onTouchend: () => resume(p.t),
  }, [
    h('svg', { class: 'toast-ic', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, [h('path', { d: ICON[p.t.kind], class: p.t.kind === 'success' ? 'm-checkmark' : '' })]),
    h('span', { class: 'toast-msg' }, p.t.message),
    p.t.action ? h('button', { class: 'toast-act', onClick: () => { p.t.action.onClick(); dismiss(p.t.id) } }, p.t.action.label) : null,
    h('button', { class: 'toast-x', 'aria-label': 'Chiudi', onClick: () => dismiss(p.t.id) }, '×'),
  ]),
}
</script>

<style>
.toast-zone { position: fixed; left: 0; right: 0; z-index: 60; padding: 0 16px; pointer-events: none; }
.toast-zone-top { top: calc(env(safe-area-inset-top) + 12px); }
.toast-zone-bottom { bottom: calc(env(safe-area-inset-bottom) + 84px); }  /* sopra la barra in basso */
.toast-stack { position: relative; display: flex; flex-direction: column; gap: 8px; }
.toast { pointer-events: auto; display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 8px 8px 14px; border-radius: 16px; font-size: 14px; font-weight: 700;
  background: rgb(var(--color-surface-2)); border: 1px solid rgb(var(--color-border-light)); color: rgb(var(--color-foam)); }
.toast-success { border-color: rgb(var(--color-success-text)); } .toast-success .toast-ic { color: rgb(var(--color-success-text)); }
.toast-error   { border-color: rgb(var(--color-danger)); }       .toast-error .toast-ic   { color: rgb(var(--color-danger-text)); }
.toast-warning { border-color: rgb(var(--color-sand)); }         .toast-warning .toast-ic { color: rgb(var(--color-sand-text)); }
.toast-info    .toast-ic { color: rgb(var(--color-ocean-text)); }
.toast-ic { width: 22px; height: 22px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.toast-msg { flex: 1; min-width: 0; }
.toast-act, .toast-x { min-width: 44px; min-height: 44px; border: 0; background: transparent; color: rgb(var(--color-ocean-text)); font-weight: 800; font-size: 14px; }
.toast-x { color: rgb(var(--color-muted)); font-size: 22px; }
</style>
