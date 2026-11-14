<template>
  <!-- Fishy, l'assistente vocale: sempre a portata di mano, anche senza uscita in corso. -->
  <div v-if="visible" class="fab-wrap" :class="{ compact }">
    <Transition name="fishy-pop">
      <span v-if="state === 'first' && bubbleOn" class="bubble" aria-hidden="true">{{ t('fishy.bubble') }}</span>
    </Transition>

    <!-- Ascolto: pillola con timer in mono e tasto Ferma (il bottone alterna «Inizia» e «Ferma»: niente pressioni lunghe) -->
    <div v-if="state === 'listening'" class="pill" role="group" :aria-label="t('fishy.fabAria')">
      <span class="rec" aria-hidden="true"></span>
      <span class="fl-mono timer">{{ elapsedLabel }}</span>
      <button type="button" class="stop" @click="finish"><Square :size="14" fill="currentColor" /> {{ t('fishy.stop') }}</button>
    </div>

    <button
      type="button" class="fab" :class="[`st-${state}`, { 'fishy-shake': state === 'error' }]"
      :aria-label="state === 'listening' ? t('fishy.stopAria') : t('fishy.fabAria')" :title="t('fishy.fabAria')"
      @click="onClick"
    >
      <span v-if="state === 'listening'" class="fishy-rings" aria-hidden="true"><i></i><i></i></span>
      <span v-if="state === 'busy'" class="ring fishy-spin" aria-hidden="true"></span>
      <Fishy :expression="EXPRESSION[state]" :size="compact ? 32 : 44" avatar :blink="blinking" />
      <span v-if="badge" class="badge fl-mono" aria-hidden="true">{{ badge }}</span>
      <span v-if="state === 'success'" class="mark ok" aria-hidden="true"><Check :size="14" :stroke-width="3" /></span>
      <span v-else-if="state === 'error'" class="mark err" aria-hidden="true"><AlertTriangle :size="14" :stroke-width="2.6" /></span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Square, Check, AlertTriangle } from 'lucide-vue-next'
import Fishy from './Fishy.vue'
import { useAuthStore } from '../stores/auth.js'
import { useFishySheet } from '../composables/useFishySheet.js'
import { useFishyVoice } from '../composables/useFishyVoice.js'
import { EXPRESSION, nextBlinkMs, badgeLabel } from '../utils/fishyFab.js'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const sheet = useFishySheet()
const { state, queued, elapsedLabel, finish } = useFishyVoice()

// Nascosto dove lo spazio è già di Fishy o dei comandi: pagine senza tab bar (scheda uscita: lì c'è la riga comandi
// larga), chat a tutta altezza, pagine pubbliche, e mentre il foglio è aperto.
const visible = computed(() => auth.isLoggedIn && !route.meta.public && !route.meta.hideBottomNav && !route.meta.fullHeight && !sheet.open.value)
const badge = computed(() => queued.value > 0 && (state.value === 'offline' || state.value === 'limit') ? badgeLabel(queued.value) : '')
// Il fumetto resta solo qualche secondo e sparisce allo scroll: non deve coprire il testo sotto.
const bubbleOn = ref(true)
const hideBubble = () => { bubbleOn.value = false }
let bubbleTimer = null
const compact = ref(false) // 40 px dove lo spazio è stretto: schermo sotto i 360 px o altezza ridotta (tastiera aperta)
const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 359px), (max-height: 480px)') : null
const syncCompact = () => { compact.value = !!mq?.matches }

function onClick() { if (state.value === 'listening') finish(); else sheet.show() }

// Ammicco di 300 ms ogni 20–30 s, solo a riposo (con movimento ridotto la CSS lo annulla).
const blinking = ref(false)
let blinkTimer = null
function scheduleBlink() {
  blinkTimer = setTimeout(() => {
    if (state.value === 'idle') { blinking.value = true; setTimeout(() => { blinking.value = false }, 300) }
    scheduleBlink()
  }, nextBlinkMs())
}
onMounted(() => { bubbleTimer = setTimeout(hideBubble, 6000); window.addEventListener('scroll', hideBubble, { once: true, passive: true, capture: true }); syncCompact(); mq?.addEventListener?.('change', syncCompact); scheduleBlink() })
onBeforeUnmount(() => { clearTimeout(blinkTimer); clearTimeout(bubbleTimer); window.removeEventListener('scroll', hideBubble, { capture: true }); mq?.removeEventListener?.('change', syncCompact) })
</script>

<style scoped>
.fab-wrap { position: fixed; right: 16px; z-index: 150; display: flex; align-items: center; gap: 8px; flex-direction: row-reverse;
  bottom: calc(var(--bottom-nav-h) + 16px + env(safe-area-inset-bottom)); }
@media (min-width: 768px) { .fab-wrap { bottom: 24px; } }
.fab { position: relative; width: 56px; height: 56px; padding: 0; border-radius: 50%; cursor: pointer; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: rgb(var(--color-sea-deep)); border: 2px solid rgb(var(--color-ocean));
  box-shadow: 0 8px 22px rgba(0, 0, 0, .3);
  transition: border-color var(--motion-base) var(--ease-enter), background-color var(--motion-base) var(--ease-enter), transform var(--motion-fast) var(--ease-standard); }
.fab:active { transform: scale(var(--scale-press)); }
.compact .fab { width: 40px; height: 40px; }
/* Il contorno e un po' di margine mantengono 44 px di area utile anche a 40 px */
.compact .fab::before { content: ''; position: absolute; inset: -2px; }
.st-listening { border-color: rgb(var(--color-sand-text)); }
.st-success { border-color: rgb(var(--color-success)); }
.st-error { border-color: rgb(var(--color-danger)); border-style: dashed; }
.st-offline { border-color: rgb(var(--color-muted)); }
.st-limit { border-color: rgb(var(--color-sand-text)); border-style: dotted; }
.ring { position: absolute; inset: -5px; border-radius: 50%; border: 3px solid transparent; border-top-color: rgb(var(--color-ocean)); border-right-color: rgb(var(--color-ocean) / .4); }
.fishy-rings i { border-color: rgb(var(--color-sand-text)); }
.badge { position: absolute; top: -4px; right: -4px; min-width: 22px; height: 22px; padding: 0 5px; border-radius: 11px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;
  background: rgb(var(--color-sand-text)); color: rgb(var(--color-ink)); border: 2px solid rgb(var(--color-ink)); }
.mark { position: absolute; top: -4px; right: -4px; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; border: 2px solid rgb(var(--color-ink)); }
.mark.ok { background: rgb(var(--color-success)); } .mark.err { background: rgb(var(--color-danger)); }
.bubble { background: rgb(var(--color-surface)); color: var(--foam); border: 1px solid var(--border); border-radius: 24px 24px 8px 24px; padding: 8px 12px; font-size: 14px; font-weight: 700; white-space: nowrap; box-shadow: 0 6px 16px rgba(0, 0, 0, .25); }
.pill { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 6px 0 14px; border-radius: 24px; background: rgb(var(--color-surface)); border: 2px solid rgb(var(--color-sand-text)); color: var(--foam); box-shadow: 0 6px 16px rgba(0, 0, 0, .25); }
.rec { width: 10px; height: 10px; border-radius: 3px; background: rgb(var(--color-danger)); }
.timer { font-size: 16px; font-weight: 700; min-width: 3ch; }
.stop { min-height: 44px; padding: 0 14px; border-radius: 22px; border: 0; background: rgb(var(--color-sand-text)); color: rgb(var(--color-ink)); font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 6px; cursor: pointer; }
</style>
