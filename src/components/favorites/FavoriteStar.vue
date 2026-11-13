<template>
  <!-- Stella per salvare o togliere un posto dalle preferite: stesso componente nella Home e nell'header del Meteo.
       Al limite (e se il posto non è già salvato) è disattivata (aria-disabled) e dice perché. -->
  <span class="fs-wrap">
    <button type="button" class="fs-btn m-press" :class="{ 'is-on': saved }" :aria-pressed="saved ? 'true' : 'false'" :aria-disabled="blocked || undefined"
      :aria-describedby="blocked ? msgId : undefined" :aria-label="saved ? t('favorites.unsave', { name }) : t('favorites.save', { name })" :title="saved ? t('favorites.unsave', { name }) : t('favorites.save', { name })" @click="onClick">
      <Star :size="22" aria-hidden="true" :fill="saved ? 'currentColor' : 'none'" />
    </button>
    <span :id="msgId" class="fs-msg" :class="{ 'fs-sr': !showMessage }" :hidden="!blocked || undefined">{{ t('favorites.limit', { n: MAX }) }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Star } from 'lucide-vue-next'
import { useFavoritesStore } from '../../stores/favorites.js'
import { useFavoriteActions } from '../../composables/useFavoriteActions.js'
import { MAX_FAVORITES as MAX } from '../../utils/favorites.js'

const props = defineProps({ place: { type: Object, default: null }, showMessage: Boolean })   // place: { name, lat, lon|lng }
const { t } = useI18n()
const fav = useFavoritesStore()
const { toggle, report } = useFavoriteActions()
const name = computed(() => props.place?.name || t('weather.yourPosition'))
const saved = computed(() => !!props.place && !!fav.findSame(props.place))
const blocked = computed(() => !saved.value && fav.limitReached)
const msgId = `fs-msg-${Math.random().toString(36).slice(2, 8)}`
function onClick() {
  if (!props.place) return
  if (blocked.value) { report('limit'); return }
  toggle({ ...props.place, name: name.value })
}
</script>

<style scoped>
.fs-wrap { display: inline-flex; flex-direction: column; align-items: center; }
.fs-btn { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 12px; background: none; color: rgb(var(--color-muted)); cursor: pointer; }
.fs-btn.is-on { color: rgb(var(--color-sand)); }
.fs-btn[aria-disabled='true'] { opacity: .45; cursor: not-allowed; }
.fs-btn:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.fs-msg { font-size: .8rem; font-weight: 600; color: rgb(var(--color-sand-text)); }
.fs-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
