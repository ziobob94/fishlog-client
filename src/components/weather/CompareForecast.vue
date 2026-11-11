<template>
  <!-- Compatto: una riga (Home, dettaglio del giorno). -->
  <div v-if="compact" class="cmp-compact">
    <span class="cmp-ico" aria-hidden="true"><ExternalLink :size="20" /></span>
    <div class="cmp-compact-tx">
      <h2 class="cmp-compact-h">{{ t('weather.compare.compactTitle') }}</h2>
      <p>{{ t('weather.compare.compactText') }}</p>
    </div>
    <span v-if="offline" class="cmp-pill-off" role="note" :aria-label="t('weather.compare.compactOfflineLabel')">{{ t('weather.compare.compactOffline') }}</span>
    <a v-else class="cmp-compact-link m-press" :href="url" target="_blank" rel="noopener noreferrer">
      {{ t('weather.compare.compactOpen') }} <ExternalLink :size="16" aria-hidden="true" />
      <span class="wx-sr"> {{ t('weather.compare.compactTitle') }} {{ t('weather.compare.newTab') }}</span>
    </a>
  </div>

  <!-- Completo: pagina Meteo. -->
  <section v-else class="wx-block cmp" aria-labelledby="cmp-h">
    <div class="cmp-head"><h2 id="cmp-h" class="wx-h" style="margin:0">{{ t('weather.compare.title') }}</h2><span class="cmp-badge">{{ t('weather.compare.badge') }}</span></div>
    <p class="cmp-text">{{ t('weather.compare.lead') }} <b>{{ t('weather.compare.brand') }}</b>, {{ t('weather.compare.praise') }}. {{ t('weather.compare.reason') }}</p>
    <button v-if="offline" type="button" class="cmp-btn cmp-btn-off" disabled>
      <WifiOff :size="20" aria-hidden="true" /> {{ t('weather.compare.offline') }}
    </button>
    <a v-else class="fl-btn1 m-press cmp-btn" :href="url" target="_blank" rel="noopener noreferrer">
      {{ t('weather.compare.cta') }} <ExternalLink :size="20" aria-hidden="true" />
      <span class="wx-sr">{{ t('weather.compare.newTab') }}</span>
    </a>
    <p class="wx-note" style="margin:0">{{ t('weather.compare.hint') }}</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExternalLink, WifiOff } from 'lucide-vue-next'
import { useWeatherStore } from '../../stores/weather.js'
import { threeBmeteoUrl } from '../../utils/threeBmeteo.js'
import { useOnline } from '../../composables/useOnline.js'
import '../../assets/weather.css'

defineProps({ compact: Boolean })
const { t } = useI18n()
const store = useWeatherStore()
const online = useOnline()
const offline = computed(() => !online.value)
const url = computed(() => threeBmeteoUrl(store.place))
</script>

<style scoped>
.cmp { display: grid; gap: 12px; }
.cmp-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.cmp-badge { font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; padding: 3px 10px; border-radius: 999px;
  border: 1px solid rgb(var(--color-ocean-text)); color: rgb(var(--color-ocean-text)); background: rgb(var(--color-ocean) / .12); }
.cmp-text { margin: 0; font-size: .95rem; line-height: 1.5; color: rgb(var(--color-muted)); }
.cmp-text b { color: rgb(var(--color-foam)); }
.cmp-btn { text-decoration: none; }
.cmp-btn-off { min-height: 54px; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
  background: rgb(var(--color-surface-2)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-muted)); font-weight: 800; font-size: 1rem; cursor: not-allowed; }

.cmp-compact { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 20px; background: rgb(var(--color-surface)); border: 1px solid rgb(var(--color-border)); }
.cmp-ico { flex: none; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; background: rgb(var(--color-ocean) / .14); color: rgb(var(--color-ocean-text)); }
.cmp-compact-tx { min-width: 0; flex: 1; }
.cmp-compact-h { font-family: var(--font-display); font-weight: 700; font-size: 1rem; margin: 0; color: rgb(var(--color-foam)); }
.cmp-compact-tx p { margin: 2px 0 0; font-size: .8rem; line-height: 1.35; color: rgb(var(--color-muted)); }
.cmp-compact-link { flex: none; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 0 8px; border-radius: 12px; font-weight: 800; font-size: .9rem; color: rgb(var(--color-foam)); text-decoration: none; }
.cmp-pill-off { flex: none; min-height: 32px; display: inline-flex; align-items: center; padding: 0 12px; border-radius: 999px; border: 1px solid rgb(var(--color-border-light)); font-size: .78rem; font-weight: 700; color: rgb(var(--color-muted)); }
.cmp-compact-link:focus-visible, .cmp-btn:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }

/* Tema chiaro: il bianco su ocean dà 4,2:1, sotto AA; qui si usa ocean-dark (≈ 6:1). */
:root[data-theme='light'] .cmp-btn:not(:disabled) { background: rgb(var(--color-ocean-dark)); }
</style>
