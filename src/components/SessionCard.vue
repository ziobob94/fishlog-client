<template>
  <RouterLink :to="session.status === 'ongoing'
      ? { path: `/session/${session._id}/edit`, hash: '#section-catches' }
      : `/session/${session._id}`"
    class="group flex sm:block bg-surface border border-border rounded-signature overflow-hidden
           transition-all duration-200 hover:border-ocean hover:-translate-y-0.5
           hover:shadow-[0_4px_24px_rgba(14,165,233,0.1)]"
  >
    <!-- Thumbnail -->
    <RulerFrame class="relative w-24 shrink-0 sm:w-auto aspect-square sm:aspect-video bg-surface-2 overflow-hidden">
      <img
        v-if="session.thumbnail"
        :src="session.thumbnail"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div v-else class="flex items-center justify-center h-full text-ocean-text/60">
        <AppIcon name="uscite" :size="40" />
      </div>
    </RulerFrame>

    <!-- Body -->
    <div class="p-3 sm:p-4 flex-1 min-w-0">
      <div class="flex items-center justify-between mb-1">
        <span class="font-mono text-muted text-xs tracking-wide">{{ fmtDate(session.date) }}</span>
        <span v-if="session.rating" class="stars text-sm">{{ '★'.repeat(session.rating) }}</span>
      </div>
      <h3 class="font-bold text-base mb-0.5 truncate text-foam">
        {{ session.title || session.location?.name || t('session.untitled') }}
      </h3>
      <p class="text-muted text-sm mb-2 truncate">
        {{ [session.technique && cap(session.technique), session.location?.spot || session.location?.name].filter(Boolean).join(' · ') }}
      </p>
      <div class="flex flex-wrap gap-1.5">
        <span v-if="session.totalCatches != null" class="chip chip-ocean">{{ t('sessions.catchesCount', { n: session.totalCatches }) }}</span>
        <span v-if="session.bestCatch" class="chip chip-sand">{{ session.bestCatch }}</span>
        <span v-if="session._pending" class="chip chip-sand icon-inline"><Hourglass :size="12" /> {{ t('offline.sessionPendingBadge') }}</span>
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
const props = defineProps({ session: { type: Object, required: true } })
import { computed } from 'vue'
import RulerFrame from './RulerFrame.vue'
import AppIcon from './AppIcon.vue'

// Coordinate in stile carta nautica, solo se l'uscita le ha
const coords = computed(() => {
  const { lat, lng } = props.session.location?.coords || {}
  if (typeof lat !== 'number' || typeof lng !== 'number') return ''
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'O'}`
})

const cap = v => v.charAt(0).toUpperCase() + v.slice(1)
const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })

const TECH_ICONS = { surfcasting: Fish, feeder: Anchor, spinning: Wind, bolentino: Anchor, mosca: Feather }
const techIcon = t => TECH_ICONS[t] || Fish

const WEATHER_ICONS = { sole: Sun, nuvoloso: CloudSun, coperto: Cloud, pioggia: CloudRain, vento: Wind, nebbia: CloudFog }
const weatherIcon = c => WEATHER_ICONS[c] || Sun
</script>

<style scoped>
.chip {
  @apply bg-surface-2 border border-border rounded-full text-xs font-semibold px-2.5 py-1;
}
.chip-ocean { @apply border-ocean/30 text-ocean-text; background: var(--ocean-glow); }
.chip-sand  { @apply border-sand/30 text-sand-text; background: rgb(var(--color-sand) / 0.12); }
.chip-muted { @apply text-muted; }
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }
</style>