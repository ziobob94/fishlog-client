<template>
  <div>
    <div v-if="loading" class="state-center"><div class="spinner"></div></div>

    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalSessions || 0 }}</span>
          <span class="stat-label">{{ t('stats.totalSessions') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalCatches || 0 }}</span>
          <span class="stat-label">{{ t('stats.totalCatches') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value text-sand-text">{{ avgRating }}</span>
          <span class="stat-label">{{ t('stats.avgRating') }}</span>
        </div>
      </div>

      <template v-if="months.length">
        <TideDivider class="mt-6">{{ t('stats.byMonth') }} · {{ t('stats.last12') }}</TideDivider>
        <figure class="chart card" role="img" :aria-label="chartLabel">
          <div class="bars">
            <div v-for="(m, i) in months" :key="i" class="bar-col">
              <div class="bar" :class="{ 'bar-max': m.catches === maxCatches && maxCatches > 0 }"
                   :style="{ height: barHeight(m.catches) }"></div>
              <span class="bar-label">{{ monthLetter(m.month) }}</span>
            </div>
          </div>
          <figcaption class="sr-only">{{ chartLabel }}</figcaption>
        </figure>
      </template>

      <template v-if="stats.topSpecies?.length">
        <TideDivider class="mt-6">{{ t('stats.topSpecies') }}</TideDivider>
        <ul class="species-list">
          <li v-for="s in stats.topSpecies" :key="s.species" class="species-row">
            <RouterLink :to="`/species/${encodeURIComponent(s.species)}`" class="species-name">{{ s.species }}</RouterLink>
            <span class="species-track"><span class="species-fill" :style="{ width: (s.count / topCount * 100) + '%' }"></span></span>
            <span class="species-count font-mono">{{ s.count }}</span>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '../utils/api.js'
import TideDivider from '../components/TideDivider.vue'

const { t } = useI18n()
const loading = ref(true)
const stats = ref({})

const avgRating = computed(() => stats.value.avgRating ? stats.value.avgRating.toFixed(1).replace('.', ',') : '—')
const months = computed(() => (stats.value.catchesByMonth || []))
const maxCatches = computed(() => Math.max(0, ...months.value.map(m => m.catches)))
const topCount = computed(() => Math.max(1, ...(stats.value.topSpecies || []).map(s => s.count)))
const barHeight = n => maxCatches.value ? `${Math.max(4, Math.round(n / maxCatches.value * 100))}%` : '4%'
const monthLetter = m => new Date(2000, m - 1, 1).toLocaleDateString('it-IT', { month: 'narrow' }).toUpperCase()
const chartLabel = computed(() => `${t('stats.byMonth')}: ` + months.value.map(m => `${m.month}/${m.year} ${m.catches}`).join(', '))

onMounted(async () => {
  try {
    const { data } = await api.get('/sessions/stats')
    stats.value = data
  } finally { loading.value = false }
})
</script>

<style scoped>
.stats-grid  { @apply grid grid-cols-3 gap-2 sm:gap-4; }
.stat-card   { @apply flex flex-col gap-1 p-3 sm:p-4 bg-surface border border-border/60 rounded-xl; }
.stat-value  { @apply font-mono text-3xl sm:text-4xl font-medium text-foam leading-tight; }
.stat-label  { @apply text-xs text-muted; }

.chart { @apply rounded-xl p-4; }
.bars { @apply flex items-end gap-1.5 h-40; }
.bar-col { @apply flex-1 flex flex-col items-center justify-end h-full gap-2; }
.bar { @apply w-full rounded-t-md bg-ocean; min-height: 4px; }
.bar-max { @apply bg-sand; }
.bar-label { @apply text-xs text-muted; }

.species-list { @apply flex flex-col gap-2 list-none; }
.species-row { @apply flex items-center gap-3 bg-surface border border-border/60 rounded-xl px-4 min-h-[56px]; }
.species-name { @apply font-bold text-foam w-28 shrink-0 truncate; }
.species-track { @apply flex-1 h-2 rounded-full bg-surface-2 overflow-hidden; }
.species-fill { @apply block h-full rounded-full bg-ocean; }
.species-count { @apply w-8 text-right text-foam; }
.sr-only { @apply absolute w-px h-px overflow-hidden; clip: rect(0 0 0 0); }
</style>
