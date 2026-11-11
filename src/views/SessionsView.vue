<template>
  <div>
    <PageHeader :title="t('nav.sessions')" bell sticky />

    <SessionFilters v-model="filters" @reset="resetFilters" />

    <RouterLink v-if="store.ongoing && !otherUser" :to="newSessionTarget" class="ongoing-panel">
      <span class="pulse-dot"></span>
      <span class="ongoing-text">
        <span class="ongoing-eyebrow">{{ t('home.ongoingTitle') }}<template v-if="store.ongoing.startTime"> · {{ t('sessions.since', { time: store.ongoing.startTime }) }}</template></span>
        <span class="ongoing-name">{{ store.ongoing.title || store.ongoing.location?.name || t('session.untitled') }}</span>
        <span class="ongoing-sub">{{ [store.ongoing.technique, store.ongoing.totalCatches != null ? t('sessions.catchesCount', { n: store.ongoing.totalCatches }) : ''].filter(Boolean).join(' · ') }}</span>
      </span>
      <span class="btn btn-sand">{{ t('sessions.resume') }}</span>
    </RouterLink>

    <TideDivider v-if="store.ongoing && !otherUser && historySessions.length">{{ t('home.historyTitle') }}</TideDivider>

    <div v-if="infiniteLoading" class="state-center">
      <div class="m-spinner"></div>
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
import PageHeader from '../components/PageHeader.vue'
import TideDivider from '../components/TideDivider.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
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
const route = useRoute()
// /sessions?user=ID: uscite di un altro utente (il server restituisce solo quelle visibili a chi guarda)
const otherUser = computed(() => (route.query.user ? String(route.query.user) : ''))

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
    mine:      otherUser.value ? undefined : 'true',
    userId:    otherUser.value || undefined,
    search:    filters.value.search    || undefined,
    technique: filters.value.technique || undefined,
    dateFrom:  filters.value.dateFrom  || undefined,
    dateTo:    filters.value.dateTo    || undefined
  }, { append }),
  pagesRef
)

const debouncedReset = useDebouncedFn(() => reset(), 320)

watch(filters, debouncedReset, { deep: true })
watch(otherUser, () => reset())

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
  @apply grid gap-3 sm:gap-4;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
}
.ongoing-panel {
  @apply flex items-center gap-3 p-4 mb-5 rounded-xl border border-sand no-underline text-foam;
  background: rgb(var(--color-sand) / 0.1);
}
.ongoing-text { @apply flex flex-col min-w-0 flex-1; }
.ongoing-eyebrow { @apply text-xs font-bold uppercase text-sand-text; letter-spacing: 0.08em; }
.ongoing-name { @apply font-bold text-lg truncate; }
.ongoing-sub { @apply text-sm text-muted; }
.btn-sand { @apply inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-sand text-on-primary font-bold shrink-0; }
.pulse-dot {
  @apply relative inline-flex h-3 w-3 rounded-full bg-sand shrink-0;
}
.pulse-dot::before {
  content: '';
  @apply absolute inline-flex h-full w-full rounded-full bg-sand/60 animate-ping;
}
</style>
