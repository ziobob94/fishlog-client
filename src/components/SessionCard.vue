<template>
  <RouterLink :to="session.status === 'ongoing'
      ? { path: `/session/${session._id}/edit`, hash: '#section-catches' }
      : `/session/${session._id}`"
    class="group block bg-surface border border-border rounded-lg overflow-hidden
           transition-all duration-200 hover:border-ocean hover:-translate-y-0.5
           hover:shadow-[0_4px_24px_rgba(14,165,233,0.1)]"
  >
    <!-- Thumbnail -->
    <div class="relative aspect-video bg-surface-2 overflow-hidden">
      <img
        v-if="session.thumbnail"
        :src="session.thumbnail"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div v-else class="flex items-center justify-center h-full text-muted">
        <component :is="techIcon(session.technique)" :size="40" />
      </div>
      <span v-if="session.technique" class="badge badge-ocean absolute bottom-2 left-2">
        {{ session.technique }}
      </span>
      <span v-if="session._pending" class="badge badge-sand absolute bottom-2 right-2 icon-inline">
        <Hourglass :size="12" /> {{ t('offline.sessionPendingBadge') }}
      </span>
    </div>

    <!-- Body -->
    <div class="p-4">
      <div class="flex items-center justify-between mb-1">
        <span class="font-mono text-muted text-xs">{{ fmtDate(session.date) }}</span>
        <span v-if="session.rating" class="stars text-sm">{{ '★'.repeat(session.rating) }}</span>
      </div>
      <h3 class="font-bold text-sm mb-1 truncate text-foam">
        {{ session.title || session.location?.name || t('session.untitled') }}
      </h3>
      <p class="text-muted text-xs mb-2 icon-inline">
        <MapPin :size="14" /> {{ session.location?.spot || session.location?.name }}
      </p>
      <div class="flex flex-wrap gap-1">
        <span v-if="session.totalCatches" class="chip icon-inline"><Fish :size="14" /> {{ session.totalCatches }}</span>
        <span v-if="session.bestCatch"    class="chip chip-sand icon-inline"><Trophy :size="14" /> {{ session.bestCatch }}</span>
        <span v-if="session.startTime"    class="chip chip-muted icon-inline"><Clock :size="14" /> {{ session.startTime }}</span>
        <span v-if="session.weather?.condition" class="chip chip-muted icon-inline"><component :is="weatherIcon(session.weather.condition)" :size="14" /></span>
        <span v-if="session.sea?.seaState"      class="chip chip-muted icon-inline"><Waves :size="14" /> {{ session.sea.seaState }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Fish, Anchor, Wind, Feather, MapPin, Trophy, Clock, Waves, Hourglass,
  Sun, CloudSun, Cloud, CloudRain, CloudFog
} from 'lucide-vue-next'

const { t } = useI18n()
defineProps({ session: { type: Object, required: true } })

const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })

const TECH_ICONS = { surfcasting: Fish, feeder: Anchor, spinning: Wind, bolentino: Anchor, mosca: Feather }
const techIcon = t => TECH_ICONS[t] || Fish

const WEATHER_ICONS = { sole: Sun, nuvoloso: CloudSun, coperto: Cloud, pioggia: CloudRain, vento: Wind, nebbia: CloudFog }
const weatherIcon = c => WEATHER_ICONS[c] || Sun
</script>

<style scoped>
.chip {
  @apply bg-surface-2 border border-border rounded text-xs px-1.5 py-0.5;
}
.chip-sand  { @apply border-sand text-sand bg-amber-500/5; }
.chip-muted { @apply text-muted; }
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }
</style>