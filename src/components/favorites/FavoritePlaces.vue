<template>
  <!-- «Le mie località»: fila di schede sotto la card meteo. Tocco = la card meteo grande mostra quel posto. -->
  <section class="fp" :aria-label="t('favorites.title')">
    <p v-if="viewingName" class="fp-viewing" role="status">
      <span>{{ t('favorites.viewing', { name: viewingName }) }}</span>
      <button type="button" class="fp-back m-press" @click="goHere"><Navigation :size="16" aria-hidden="true" /> {{ t('favorites.backToHere') }}</button>
    </p>

    <div class="fp-head">
      <h2 class="fp-title">{{ t('favorites.title') }}</h2>
      <button type="button" class="fp-manage m-press" :disabled="!fav.count" @click="manageOpen = true">{{ t('favorites.manage') }}</button>
    </div>

    <p v-if="offline" class="fp-banner" role="status"><WifiOff :size="16" aria-hidden="true" /> {{ t('favorites.offlineBanner') }}</p>
    <p v-if="offline && fav.cardsAt" class="fp-stale wx-num">{{ t('favorites.updatedStale', { time: clock(fav.cardsAt) }) }}</p>
    <p v-else-if="fav.cardsAt" class="fp-stale wx-num">{{ t('favorites.updatedAt', { time: clock(fav.cardsAt) }) }}</p>
    <p v-if="loadingCards" class="fp-sr" role="status">{{ t('favorites.loadingCards') }}</p>

    <div ref="rail" class="fp-rail" role="list" :aria-busy="loadingCards ? 'true' : undefined" @keydown="onKey">
      <div role="listitem" class="fp-item"><FavoriteCard kind="here" :name="t('favorites.here')" :data="cardFor('here')" :active="activeId === 'here'" @select="goHere" /></div>
      <div v-for="p in fav.places" :key="p.id" role="listitem" class="fp-item"><FavoriteCard :name="p.name" :data="cardFor(p.id)" :active="activeId === p.id" @select="view(p)" /></div>
      <div v-if="!fav.limitReached" role="listitem" class="fp-item"><FavoriteCard kind="add" @select="addOpen = true" /></div>
    </div>

    <div v-if="fav.loaded && !fav.count" class="fp-empty">
      <h3 class="fp-empty-t">{{ t('favorites.emptyTitle') }}</h3>
      <p>{{ t('favorites.emptyText') }}</p>
    </div>

    <FavoritesManageSheet v-model="manageOpen" />
    <FavoritesAddSheet v-model="addOpen" @view="view" />
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Navigation, WifiOff } from 'lucide-vue-next'
import FavoriteCard from './FavoriteCard.vue'
import FavoritesManageSheet from './FavoritesManageSheet.vue'
import FavoritesAddSheet from './FavoritesAddSheet.vue'
import { useFavoritesStore, HERE_ID } from '../../stores/favorites.js'
import { useWeatherStore } from '../../stores/weather.js'
import { useOnline } from '../../composables/useOnline.js'
import { reverseLabel } from '../../utils/places.js'

const { t } = useI18n()
const fav = useFavoritesStore()
const weather = useWeatherStore()
const online = useOnline()
const offline = computed(() => !online.value || fav.cardsStatus === 'offline')
const manageOpen = ref(false), addOpen = ref(false), rail = ref(null)
const clock = ms => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })

// Scheda attiva: «La mia posizione» se la card grande è sul GPS, altrimenti il preferito con le stesse coordinate.
const activeId = computed(() => {
  const p = weather.place
  if (!p) return null
  if (p.mode === 'here') return HERE_ID
  return fav.findSame({ lat: p.lat, lon: p.lng })?.id || null
})
const viewingName = computed(() => (activeId.value !== HERE_ID && weather.place ? (weather.place.name || t('weather.yourPosition')) : ''))
const cardFor = id => fav.cards[id] || null
const loadingCards = computed(() => fav.cardsStatus === 'loading')

async function view(p) {
  addOpen.value = false
  weather.pickPlace({ name: p.name, lat: p.lat, lng: p.lon ?? p.lng })
  await weather.load({ force: false })
}
async function goHere() {
  if (!(await weather.useHere())) return
  await weather.load({ force: false })
  const p = weather.place
  if (p && !p.name) { try { weather.setName(await reverseLabel(p.lat, p.lng)) } catch { /* resta «La tua posizione» */ } }
}

// La posizione GPS usata dalla card meteo diventa la scheda «La mia posizione».
watch(() => weather.place, p => {
  if (p?.mode === 'here') { const h = fav.hereSpot; if (!h || h.lat !== p.lat || h.lon !== p.lng) { fav.setHere(p.lat, p.lng); fav.loadCards() } }
}, { immediate: true })
watch(() => fav.places.length, () => fav.loadCards())
watch(online, on => { if (on) fav.loadCards() })

onMounted(async () => { await fav.load(); fav.loadCards() })

// Frecce sinistra/destra spostano il focus tra le schede.
function onKey(e) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  const btns = [...rail.value.querySelectorAll('button')]
  const i = btns.indexOf(document.activeElement)
  if (i < 0) return
  const next = btns[i + (e.key === 'ArrowRight' ? 1 : -1)]
  if (next) { e.preventDefault(); next.focus() }
}
</script>

<style scoped>
.fp { display: grid; gap: 8px; margin: 0 0 16px; min-width: 0; }
.fp-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.fp-title { font-family: var(--font-display); font-size: 1.2rem; margin: 0; }
.fp-manage { min-height: 44px; padding: 0 12px; border: 0; border-radius: 12px; background: none; color: rgb(var(--color-ocean-text)); font: inherit; font-weight: 800; cursor: pointer; }
.fp-manage:disabled { opacity: .4; cursor: not-allowed; }
.fp-manage:focus-visible, .fp-back:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.fp-viewing { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0; padding: 4px 4px 4px 14px; border-radius: 14px; background: rgb(var(--color-surface-2)); border: 1px solid rgb(var(--color-border)); font-weight: 700; font-size: .9rem; }
.fp-back { min-height: 44px; display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border: 0; border-radius: 12px; background: none; color: rgb(var(--color-ocean-text)); font: inherit; font-weight: 800; cursor: pointer; flex: none; }
.fp-banner { display: flex; align-items: center; gap: 8px; margin: 0; padding: 10px 14px; border-radius: 14px; border: 1px solid rgb(var(--color-sand-text)); background: rgb(var(--color-sand) / .12); font-size: .88rem; font-weight: 600; }
.fp-banner svg { color: rgb(var(--color-sand-text)); flex: none; }
.fp-stale { margin: 0; font-size: .78rem; color: rgb(var(--color-muted)); }
.fp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.fp-rail { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x proximity; scroll-padding-left: 16px; padding: 4px 16px 8px; margin: 0 -16px; overscroll-behavior-x: contain; scrollbar-width: thin; }
.fp-item { flex: none; display: flex; }
.fp-empty { padding: 4px 4px 0; }
.fp-empty-t { font-family: var(--font-display); font-size: 1.05rem; margin: 0 0 2px; }
.fp-empty p { margin: 0; font-size: .88rem; color: rgb(var(--color-muted)); }
</style>
