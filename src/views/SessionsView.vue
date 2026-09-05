<template>
  <div>
    <div class="home-hero">
      <div>
        <h1>{{ t('home.titlePrefix') }} <span class="text-ocean">{{ t('home.titleHighlight') }}</span></h1>
        <p class="text-muted mt-1">{{ t('home.sessionsCount', { n: store.total }) }}</p>
      </div>
      <RouterLink to="/new" class="btn btn-primary">{{ t('home.newSession') }}</RouterLink>
    </div>

    <SessionFilters v-model="filters" @reset="resetFilters" />

    <div v-if="store.loading" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!store.sessions.length" class="state-center">
      <div style="font-size:3.5rem">🐟</div>
      <h3>{{ t('home.empty.title') }}</h3>
      <p class="text-muted">{{ t('home.empty.text') }}</p>
      <RouterLink to="/new" class="btn btn-primary mt-2">{{ t('home.empty.register') }}</RouterLink>
    </div>

    <div v-else class="sessions-grid">
      <SessionCard v-for="s in store.sessions" :key="s._id" :session="s" />
    </div>

    <PaginationBar
      :current="pagination.page.value"
      :pages="store.pagination.pages"
      @change="pagination.goTo"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '../stores/sessions.js'
import { usePagination } from '../composables/usePagination.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'
import SessionCard    from '../components/SessionCard.vue'
import SessionFilters from '../components/SessionFilters.vue'
import PaginationBar  from '../components/PaginationBar.vue'

const { t } = useI18n()
const store = useSessionStore()

const filters = ref({ search: '', technique: '', dateFrom: '', dateTo: '' })

async function fetchData(page) {
  await store.fetchSessions({
    page,
    search:    filters.value.search    || undefined,
    technique: filters.value.technique || undefined,
    dateFrom:  filters.value.dateFrom  || undefined,
    dateTo:    filters.value.dateTo    || undefined
  })
  return store.pagination.pages
}

const pagination = usePagination(fetchData)
const debouncedReset = useDebouncedFn(() => pagination.reset(), 320)

watch(filters, debouncedReset, { deep: true })

function resetFilters() {
  filters.value = { search: '', technique: '', dateFrom: '', dateTo: '' }
  pagination.reset()
}

onMounted(() => pagination.load())
</script>

<style scoped>
.home-hero {
  @apply flex items-end justify-between mb-6;
}
.sessions-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
}
</style>