<template>
  <div>
    <section v-if="store.ongoing" class="ongoing-section">
      <h2 class="ongoing-heading">
        <span class="pulse-dot"></span> {{ t('home.ongoingTitle') }}
      </h2>
      <div class="sessions-grid">
        <SessionCard :session="store.ongoing" />
      </div>
    </section>

    <SessionFilters v-model="filters" @reset="resetFilters" />

    <h2 v-if="store.ongoing && historySessions.length" class="ongoing-heading text-muted mb-2">
      {{ t('home.historyTitle') }}
    </h2>

    <div v-if="infiniteLoading" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!historySessions.length" class="state-center">
      <div style="font-size:3.5rem; display:flex; justify-content:center"><Fish :size="56" /></div>
      <h3>{{ t('home.empty.title') }}</h3>
      <p class="text-muted">{{ t('home.empty.text') }}</p>
      <RouterLink :to="newSessionTarget" class="btn btn-primary mt-2">
        {{ store.ongoing ? t('nav.ongoingSession') : t('home.empty.register') }}
      </RouterLink>
    </div>

    <div v-else class="sessions-grid">
      <SessionCard v-for="s in historySessions" :key="s._id" :session="s" />
    </div>

    <InfiniteSentinel :active="hasMore" :loading="loadingMore" @trigger="loadMore" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish } from 'lucide-vue-next'
import { useSessionStore } from '../stores/sessions.js'
import { useInfiniteScroll } from '../composables/useInfiniteScroll.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'
import SessionCard    from '../components/SessionCard.vue'
import SessionFilters from '../components/SessionFilters.vue'
import InfiniteSentinel from '../components/InfiniteSentinel.vue'

const { t } = useI18n()
const store = useSessionStore()

const filters = ref({ search: '', technique: '', dateFrom: '', dateTo: '' })

const historySessions = computed(() =>
  store.sessions.filter(s => !store.ongoing || s._id !== store.ongoing._id)
)

const newSessionTarget = computed(() =>
  store.ongoing
    ? { path: `/session/${store.ongoing._id}/edit`, hash: '#section-catches' }
    : { path: '/new' }
)

const pagesRef = computed(() => store.pagination.pages)
const { loading: infiniteLoading, loadingMore, hasMore, reset, loadMore } = useInfiniteScroll(
  (page, { append }) => store.fetchSessions({
    page,
    search:    filters.value.search    || undefined,
    technique: filters.value.technique || undefined,
    dateFrom:  filters.value.dateFrom  || undefined,
    dateTo:    filters.value.dateTo    || undefined
  }, { append }),
  pagesRef
)

const debouncedReset = useDebouncedFn(() => reset(), 320)

watch(filters, debouncedReset, { deep: true })

function resetFilters() {
  filters.value = { search: '', technique: '', dateFrom: '', dateTo: '' }
  reset()
}

onMounted(() => {
  reset()
  store.fetchOngoing()
})
</script>

<style scoped>
.sessions-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
}
.ongoing-section {
  @apply mb-8;
}
.ongoing-heading {
  @apply flex items-center gap-2 font-bold text-sm uppercase tracking-wide mb-3 text-sand;
}
.pulse-dot {
  @apply relative inline-flex h-2 w-2 rounded-full bg-sand;
}
.pulse-dot::before {
  content: '';
  @apply absolute inline-flex h-full w-full rounded-full bg-sand/60 animate-ping;
}
</style>
