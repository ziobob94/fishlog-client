<template>
  <div>
    <PageHeader :title="t('species.searchTitle')" back />

    <div class="search-wrap mb-3">
      <Search :size="16" class="search-icon" />
      <input
        v-model="query" type="search" :placeholder="t('species.searchPlaceholder')" :aria-label="t('species.searchPlaceholder')"
        class="search-input" @input="onInput"
      />
    </div>

    <p v-if="!query.trim()" class="text-muted text-sm">{{ t('species.searchHint') }}</p>
    <div v-else-if="loading" class="state-center"><div class="m-spinner"></div></div>
    <p v-else-if="!results.length" class="text-muted text-sm">{{ t('species.noResults') }}</p>

    <div v-else class="species-grid">
      <RouterLink
        v-for="r in results" :key="r._id"
        :to="`/species/${encodeURIComponent(displayName(r))}`"
        class="species-card card"
      >
        <img v-if="r.imageUrl" :src="r.imageUrl" class="species-thumb" />
        <div v-else class="species-thumb species-thumb-placeholder"><Fish :size="22" /></div>
        <div class="species-card-text">
          <strong>{{ displayName(r) }}</strong>
          <span class="scientific">{{ r.scientificName }}</span>
        </div>
        <ChevronRight :size="18" class="text-muted ml-auto shrink-0" />
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '../components/PageHeader.vue'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish, Search, ChevronRight } from 'lucide-vue-next'
import { useSpecies } from '../composables/useSpecies.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'

const { t } = useI18n()
const { searchSpecies } = useSpecies()

const query = ref('')
const results = ref([])
const loading = ref(false)

function displayName(r) {
  return r.commonNameIt || r.commonNameEn || r.scientificName
}

const runSearch = useDebouncedFn(async (q) => {
  loading.value = true
  try { results.value = await searchSpecies(q) } finally { loading.value = false }
}, 350)

function onInput() {
  const q = query.value.trim()
  if (q.length < 2) { results.value = []; return }
  runSearch(q)
}
</script>

<style scoped>
.page-header {
  @apply flex items-center gap-4 mb-4;
}

.search-wrap { @apply relative; }
.search-icon { @apply absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none; }
.search-input { @apply w-full min-h-[48px] rounded-xl pl-10 pr-4; }

.species-grid {
  @apply grid gap-3;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
}

.species-card {
  @apply flex items-center gap-3 no-underline text-inherit hover:border-ocean transition-colors;
}

.species-card-text {
  @apply flex flex-col min-w-0;
}
.species-card-text strong { @apply text-base text-foam; }
.scientific { @apply italic text-sm text-muted; }

.species-thumb {
  @apply w-12 h-12 rounded-xl object-cover shrink-0;
}

.species-thumb-placeholder {
  @apply flex items-center justify-center border border-ocean text-ocean-text;
  background: var(--ocean-glow);
}

.scientific {
  @apply block text-xs text-muted italic truncate;
}
</style>
