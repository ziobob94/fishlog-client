<template>
  <div>
    <div class="page-header">
      <RouterLink to="/species" class="btn btn-ghost btn-sm">{{ t('common.back') }}</RouterLink>
    </div>

    <div v-if="loading && !species" class="state-center"><div class="spinner"></div></div>

    <div v-else-if="!species" class="state-center species-not-found">
      <Fish :size="32" />
      <h3>{{ t('species.notFound.title') }}</h3>
      <p class="text-muted">{{ t('species.notFound.text') }}</p>
      <p v-if="reported" class="text-success text-sm mt-2">{{ t('species.reported') }}</p>
      <button v-else class="btn btn-secondary mt-2" :disabled="reporting" @click="report">
        {{ t('species.notFound.report') }}
      </button>
    </div>

    <template v-else>
      <div class="species-header card">
        <img v-if="species.imageUrl" :src="species.imageUrl" class="species-image" />
        <div v-else class="species-image species-image-placeholder"><Fish :size="36" /></div>
        <div class="min-w-0">
          <h2 class="truncate">{{ displayName }}</h2>
          <p class="scientific-name">{{ species.scientificName }}</p>
          <p v-if="species.catchCount" class="text-muted text-sm mt-1">{{ t('species.catchCount', { n: species.catchCount }) }}</p>
        </div>
      </div>

      <p v-if="species.description" class="species-description">{{ species.description }}</p>

      <!-- Suggeritore attrezzatura: stessa scheda, ristretta a uno scenario
           più specifico se l'utente sceglie tecnica e/o tipo di acqua. -->
      <div class="gear-filters card mt-3">
        <div class="form-group">
          <label>{{ t('species.filters.techniqueLabel') }}</label>
          <select v-model="technique">
            <option value="">{{ t('species.filters.any') }}</option>
            <option v-for="o in TECHNIQUES" :key="o.v" :value="o.v">{{ o.l }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('species.filters.waterTypeLabel') }}</label>
          <select v-model="waterType">
            <option value="">{{ t('species.filters.any') }}</option>
            <option v-for="o in WATER_TYPES" :key="o.v" :value="o.v">{{ o.l }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="state-center"><div class="spinner"></div></div>

      <template v-else>
        <section class="card mt-3">
          <h3>{{ t('species.calendar.title') }}</h3>
          <p class="text-muted text-xs mb-3">{{ t('species.calendar.subtitle') }}</p>

          <div v-if="species.catchCount" class="calendar-bars">
            <div v-for="(count, i) in species.monthlyCatches" :key="i" class="calendar-col">
              <span class="calendar-count">{{ count || '' }}</span>
              <div class="calendar-bar" :style="{ height: barHeight(count) + '%' }"></div>
              <span class="calendar-month">{{ t(`species.months.${i + 1}`) }}</span>
            </div>
          </div>
          <p v-else class="text-muted text-sm">{{ t('species.calendar.empty') }}</p>
        </section>

        <section v-if="species.topBaits?.length" class="card mt-3">
          <h3>{{ t('species.gear.baitsTitle') }}</h3>
          <div class="chip-list">
            <span v-for="b in species.topBaits" :key="b" class="chip">{{ b }}</span>
          </div>
        </section>

        <section v-if="species.topRigs?.length" class="card mt-3">
          <h3>{{ t('species.gear.rigsTitle') }}</h3>
          <div class="chip-list">
            <span v-for="r in species.topRigs" :key="r" class="chip">{{ r }}</span>
          </div>
        </section>

        <section v-if="species.lineMainLb" class="card mt-3">
          <h3>{{ t('species.gear.lineTitle') }}</h3>
          <p class="text-sm text-foam">
            {{ t('species.gear.lineRange', { avg: species.lineMainLb.avg, min: species.lineMainLb.min, max: species.lineMainLb.max }) }}
          </p>
        </section>

        <section v-if="species.topTechniques?.length" class="card mt-3">
          <h3>{{ t('species.gear.techniquesTitle') }}</h3>
          <div class="chip-list">
            <span v-for="tq in species.topTechniques" :key="tq" class="chip chip-technique">{{ tq }}</span>
          </div>
        </section>

        <p v-if="!hasGearData" class="text-muted text-sm mt-3">{{ t('species.gear.empty') }}</p>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish } from 'lucide-vue-next'
import { useSpecies } from '../composables/useSpecies.js'

const { t } = useI18n()
const route = useRoute()
const { fetchSpeciesByName, reportMissingSpecies } = useSpecies()

const TECHNIQUES = [
  { v: 'surfcasting', l: 'Surfcasting' }, { v: 'feeder', l: 'Feeder' },
  { v: 'spinning', l: 'Spinning' }, { v: 'bolentino', l: 'Bolentino' },
  { v: 'mosca', l: 'Mosca' }, { v: 'altro', l: 'Altro' }
]
const WATER_TYPES = [
  { v: 'mare', l: '🌊 Mare' },
  { v: 'fiume', l: '🏞️ Fiume' },
  { v: 'lago', l: '🏔️ Lago' },
  { v: 'altro', l: '💧 Altro' }
]

const species = ref(null)
const loading = ref(true)
const reporting = ref(false)
const reported = ref(false)
const technique = ref('')
const waterType = ref('')

const displayName = computed(() => species.value?.commonNameIt || species.value?.commonNameEn || species.value?.scientificName)
const hasGearData = computed(() => !!(species.value?.topBaits?.length || species.value?.topRigs?.length || species.value?.lineMainLb || species.value?.topTechniques?.length))

function barHeight(count) {
  const max = Math.max(...(species.value?.monthlyCatches || [1]), 1)
  return Math.max((count / max) * 100, count > 0 ? 8 : 0)
}

async function load(name) {
  loading.value = true
  reported.value = false
  try {
    species.value = await fetchSpeciesByName(name, { technique: technique.value, waterType: waterType.value })
  } finally {
    loading.value = false
  }
}

async function report() {
  reporting.value = true
  try {
    await reportMissingSpecies(route.params.name)
    reported.value = true
  } finally {
    reporting.value = false
  }
}

watch(() => route.params.name, (name) => { if (name) load(name) }, { immediate: true })
watch([technique, waterType], () => { if (route.params.name) load(route.params.name) })
</script>

<style scoped>
.page-header {
  @apply flex items-center gap-4 mb-4;
}

.species-not-found {
  @apply flex flex-col items-center gap-1 py-10;
}

.species-header {
  @apply flex items-center gap-4;
}

.species-image {
  @apply w-20 h-20 rounded-full object-cover shrink-0;
}

.species-image-placeholder {
  @apply flex items-center justify-center border border-ocean text-ocean;
  background: var(--ocean-glow);
}

.scientific-name {
  @apply text-muted italic text-sm;
}

.species-description {
  @apply text-sm text-foam mt-3 whitespace-pre-wrap;
}

.gear-filters {
  @apply flex flex-wrap gap-3;
}

.gear-filters .form-group {
  @apply flex-1 min-w-[160px];
}

.calendar-bars {
  @apply flex items-end gap-1.5;
  height: 7rem;
}

.calendar-col {
  @apply flex-1 flex flex-col items-center justify-end gap-1 h-full;
}

.calendar-count {
  @apply text-[0.65rem] text-muted h-3;
}

.calendar-bar {
  @apply w-full rounded-t-sm bg-ocean min-h-0;
}

.calendar-month {
  @apply text-[0.65rem] text-muted;
}

.chip-list {
  @apply flex flex-wrap gap-1.5;
}

.chip {
  @apply bg-surface-2 border border-border rounded text-xs px-2 py-1;
}

.chip-technique {
  @apply capitalize;
}
</style>
