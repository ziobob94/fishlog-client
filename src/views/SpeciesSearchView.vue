<template>
  <div>
    <div class="page-header">
      <h2>{{ t('species.searchTitle') }}</h2>
    </div>

    <input
      v-model="query" type="search" :placeholder="t('species.searchPlaceholder')"
      class="search-input mb-4" @input="onInput"
    />

    <p v-if="!query.trim()" class="text-muted text-sm">{{ t('species.searchHint') }}</p>
    <div v-else-if="loading" class="state-center"><div class="spinner"></div></div>
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
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish } from 'lucide-vue-next'
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

.search-input {
  @apply w-full max-w-sm;
}

.species-grid {
  @apply grid gap-3;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.species-card {
  @apply flex items-center gap-3 no-underline text-inherit hover:border-ocean transition-colors;
}

.species-card-text {
  @apply flex flex-col min-w-0;
}

.species-thumb {
  @apply w-12 h-12 rounded-full object-cover shrink-0;
}

.species-thumb-placeholder {
  @apply flex items-center justify-center border border-ocean text-ocean;
  background: var(--ocean-glow);
}

.scientific {
  @apply block text-xs text-muted italic truncate;
}
</style>
