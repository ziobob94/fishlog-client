<template>
  <!-- «Adesso»: meteo e attività dei pesci del luogo mostrato, in un'unica scheda. La nota «Indicativa» compare una sola volta, in fondo. -->
  <section class="now" :aria-label="t('home.now.label')">
    <!-- Altro luogo: la scheda mostra un preferito, non la posizione GPS -->
    <p v-if="viewingName" class="now-viewing" role="status">
      <span class="now-viewing-t">{{ t('favorites.viewing', { name: viewingName }) }}</span>
      <button type="button" class="now-back m-press" @click="goHere"><Navigation :size="16" aria-hidden="true" /> {{ t('favorites.backToHere') }}</button>
    </p>

    <HomeWeatherCard embedded />
    <FishActivityCard embedded />

    <p v-if="weather.place" class="now-note"><Info :size="14" aria-hidden="true" /> {{ t('fishAct.note') }}</p>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { Navigation, Info } from 'lucide-vue-next'
import HomeWeatherCard from './weather/HomeWeatherCard.vue'
import FishActivityCard from './fishing/FishActivityCard.vue'
import { useWeatherStore } from '../stores/weather.js'
import { usePlaceView } from '../composables/usePlaceView.js'

const { t } = useI18n()
const weather = useWeatherStore()
const { viewingName, goHere } = usePlaceView()
</script>

<style scoped>
.now { display: grid; gap: 12px; min-width: 0; padding: 12px 16px 14px; border-radius: 24px 24px 24px 8px; background: rgb(var(--color-surface)); border: 1px solid rgb(var(--color-border)); }
.now-viewing { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0; padding: 0 0 0 14px; border-radius: 14px; background: rgb(var(--color-surface-2)); border: 1px solid rgb(var(--color-border)); font-weight: 700; font-size: .9rem; }
.now-viewing-t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.now-back { min-height: 44px; display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border: 0; border-radius: 12px; background: none; color: rgb(var(--color-ocean-text)); font: inherit; font-weight: 800; cursor: pointer; flex: none; }
.now-back:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.now-note { display: flex; align-items: center; gap: 6px; margin: 0; font-size: .8rem; color: rgb(var(--color-muted)); }
.now-note svg { flex: none; }
</style>
