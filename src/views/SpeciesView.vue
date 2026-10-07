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
        <div class="species-image-wrap">
          <img v-if="species.imageUrl" :src="species.imageUrl" class="species-image" />
          <div v-else class="species-image species-image-placeholder"><Fish :size="36" /></div>
        </div>
        <div class="min-w-0">
          <h2 class="truncate">{{ displayName }}</h2>
          <p class="scientific-name">{{ species.scientificName }}</p>
          <p v-if="species.catchCount" class="text-muted text-sm mt-1 icon-inline"><Fish :size="13" /> {{ t('species.catchCount', { n: species.catchCount }) }}</p>
        </div>
      </div>

      <p v-if="species.description" class="species-description">{{ species.description }}</p>

      <!-- Stato legale: se la specie è protetta in qualche norma applicabile,
           niente esche/calendario/montatura — solo l'avviso, come per il
           competitor analizzato è il principale elemento di fiducia. -->
      <section v-if="legalLoaded && regulations.length" class="card mt-3 legal-card" :class="{ 'legal-card-danger': isProtected }">
        <h3 class="icon-inline"><ShieldAlert :size="17" /> {{ t('species.legal.title') }}</h3>

        <div v-if="isProtected" class="legal-protected-banner icon-inline">
          <ShieldAlert :size="18" />
          <span>{{ t('species.legal.protectedBanner') }}</span>
        </div>

        <div v-for="r in regulations" :key="r._id" class="legal-rule">
          <p class="legal-rule-title">{{ r.title }}</p>
          <div class="legal-rule-facts">
            <span v-if="r.minSizeCm" class="chip chip-legal"><Ruler :size="12" /> {{ t('species.legal.minSize') }}: {{ r.minSizeCm }} cm</span>
            <span v-if="r.maxCatchPerDay" class="chip chip-legal">{{ t('species.legal.maxCatch', { n: r.maxCatchPerDay }) }}</span>
            <span v-if="r.closedSeason" class="chip chip-legal"><CalendarOff :size="12" /> {{ t('species.legal.closedSeason') }}: {{ r.closedSeason }}</span>
          </div>
          <p v-if="r.notes" class="legal-rule-notes">{{ r.notes }}</p>
          <p class="legal-rule-source">
            {{ t('species.legal.source') }}:
            <a v-if="r.sourceUrl" :href="r.sourceUrl" target="_blank" rel="noopener">{{ r.sourceTitle }}</a>
            <span v-else>{{ r.sourceTitle }}</span>
          </p>
        </div>

        <p class="legal-disclaimer">{{ t('species.legal.disclaimer') }}</p>
      </section>

      <template v-if="!isProtected">
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
            <h3 class="icon-inline"><CalendarDays :size="17" /> {{ t('species.calendar.title') }}</h3>
            <p class="text-muted text-xs mb-3">{{ t('species.calendar.subtitle') }}</p>

            <div v-if="species.catchCount" class="calendar-bars">
              <div v-for="(count, i) in species.monthlyCatches" :key="i" class="calendar-col">
                <span class="calendar-count">{{ count || '' }}</span>
                <div class="calendar-bar" :class="{ 'calendar-bar-peak': count === maxMonthCount && count > 0 }" :style="{ height: barHeight(count) + '%' }" :title="`${t(`species.months.${i + 1}`)}: ${count}`"></div>
                <span class="calendar-month">{{ t(`species.months.${i + 1}`) }}</span>
              </div>
            </div>
            <p v-else class="text-muted text-sm">{{ t('species.calendar.empty') }}</p>
          </section>

          <section v-if="species.topBaits?.length" class="card mt-3">
            <h3 class="icon-inline"><Worm :size="17" /> {{ t('species.gear.baitsTitle') }}</h3>
            <div class="chip-list">
              <span v-for="b in species.topBaits" :key="b" class="chip chip-bait">{{ b }}</span>
            </div>
          </section>

          <section v-if="species.topRigs?.length" class="card mt-3">
            <h3 class="icon-inline"><Settings2 :size="17" /> {{ t('species.gear.rigsTitle') }}</h3>
            <div class="chip-list">
              <span v-for="r in species.topRigs" :key="r" class="chip chip-rig">{{ r }}</span>
            </div>
          </section>

          <section v-if="species.lineMainLb" class="card mt-3">
            <h3 class="icon-inline"><Ruler :size="17" /> {{ t('species.gear.lineTitle') }}</h3>
            <p class="text-sm text-foam">
              {{ t('species.gear.lineRange', { avg: species.lineMainLb.avg, min: species.lineMainLb.min, max: species.lineMainLb.max }) }}
            </p>
          </section>

          <section v-if="species.topTechniques?.length" class="card mt-3">
            <h3 class="icon-inline"><Target :size="17" /> {{ t('species.gear.techniquesTitle') }}</h3>
            <div class="chip-list">
              <span v-for="tq in species.topTechniques" :key="tq" class="chip chip-technique">{{ tq }}</span>
            </div>
          </section>

          <p v-if="!hasGearData" class="text-muted text-sm mt-3">{{ t('species.gear.empty') }}</p>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish, ShieldAlert, Ruler, CalendarOff, CalendarDays, Worm, Settings2, Target } from 'lucide-vue-next'
import { useSpecies } from '../composables/useSpecies.js'
import { useRegulations } from '../composables/useRegulations.js'

const { t } = useI18n()
const route = useRoute()
const { fetchSpeciesByName, reportMissingSpecies } = useSpecies()
const { fetchRegulations } = useRegulations()

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

const regulations = ref([])
const legalLoaded = ref(false)
const isProtected = computed(() => regulations.value.some(r => r.protected))

const displayName = computed(() => species.value?.commonNameIt || species.value?.commonNameEn || species.value?.scientificName)
const hasGearData = computed(() => !!(species.value?.topBaits?.length || species.value?.topRigs?.length || species.value?.lineMainLb || species.value?.topTechniques?.length))
const maxMonthCount = computed(() => Math.max(...(species.value?.monthlyCatches || [0])))

function barHeight(count) {
  const max = Math.max(...(species.value?.monthlyCatches || [1]), 1)
  return Math.max((count / max) * 100, count > 0 ? 8 : 0)
}

async function load(name) {
  loading.value = true
  reported.value = false
  legalLoaded.value = false
  try {
    const [sp, regs] = await Promise.all([
      fetchSpeciesByName(name, { technique: technique.value, waterType: waterType.value }),
      fetchRegulations({ species: name })
    ])
    species.value = sp
    regulations.value = regs
    legalLoaded.value = true
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

.icon-inline {
  @apply flex items-center gap-1.5;
}

.species-not-found {
  @apply flex flex-col items-center gap-1 py-10;
}

.species-header {
  @apply flex items-center gap-4;
}

.species-image-wrap {
  @apply shrink-0 rounded-full p-0.5;
  background: linear-gradient(135deg, var(--ocean), var(--sand) 150%);
}

.species-image {
  @apply w-20 h-20 rounded-full object-cover block border-2;
  border-color: var(--surface);
}

.species-image-placeholder {
  @apply flex items-center justify-center border-2 text-ocean;
  border-color: var(--surface);
  background: var(--ocean-glow);
}

.scientific-name {
  @apply text-muted italic text-sm;
}

.species-description {
  @apply text-sm text-foam mt-3 whitespace-pre-wrap;
}

h3 {
  @apply text-ocean;
}

.legal-card {
  @apply border-sand/50;
}

.legal-card-danger {
  @apply border-danger/60;
}

.legal-card h3 {
  @apply text-sand;
}

.legal-card-danger h3 {
  @apply text-danger;
}

.legal-protected-banner {
  @apply bg-danger/10 border border-danger text-danger rounded-sm px-3 py-2.5 text-sm font-semibold mt-2;
}

.legal-rule {
  @apply border-t border-border pt-2.5 mt-2.5;
}

.legal-rule:first-of-type {
  @apply border-t-0 pt-0 mt-2;
}

.legal-rule-title {
  @apply text-sm font-semibold text-foam;
}

.legal-rule-facts {
  @apply flex flex-wrap gap-1.5 mt-1.5;
}

.legal-rule-notes {
  @apply text-xs text-muted mt-1.5;
}

.legal-rule-source {
  @apply text-xs text-muted mt-1.5;
}

.legal-rule-source a {
  @apply text-ocean;
}

.legal-disclaimer {
  @apply text-[0.7rem] text-muted italic mt-3 pt-2 border-t border-border;
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
  @apply w-full rounded-t-sm min-h-0 transition-all;
  background: linear-gradient(180deg, var(--ocean), rgb(var(--color-ocean) / 0.55));
}

.calendar-bar-peak {
  background: linear-gradient(180deg, var(--sand), var(--ocean));
}

.calendar-month {
  @apply text-[0.65rem] text-muted;
}

.chip-list {
  @apply flex flex-wrap gap-1.5;
}

.chip {
  @apply inline-flex items-center gap-1 bg-surface-2 border border-border rounded-full text-xs px-2.5 py-1;
}

.chip-bait {
  @apply border-ocean/30 text-ocean;
  background: var(--ocean-glow);
}

.chip-rig {
  @apply border-sand/30 text-sand;
  background: rgb(var(--color-sand) / 0.1);
}

.chip-technique {
  @apply capitalize;
}

.chip-legal {
  @apply border-sand/40 text-foam;
}
</style>
