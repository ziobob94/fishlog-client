<template>
  <div>
    <div class="home-hero">
      <div>
        <h1>Le tue <span class="text-ocean">uscite</span></h1>
        <p class="text-muted mt-1">{{ store.total }} sessioni registrate</p>
      </div>
      <RouterLink to="/new" class="btn btn-primary">+ Nuova uscita</RouterLink>
    </div>

    <SessionFilters v-model="filters" @reset="resetFilters" />

    <div v-if="store.loading" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!store.sessions.length" class="state-center">
      <div style="font-size:3.5rem">🐟</div>
      <h3>Nessuna uscita trovata</h3>
      <p class="text-muted">Registra la tua prima sessione</p>
      <RouterLink to="/new" class="btn btn-primary mt-2">+ Registra uscita</RouterLink>
    </div>

    <div v-else class="sessions-grid">
      <SessionCard v-for="s in store.sessions" :key="s._id" :session="s" />
    </div>

    <PaginationBar
      :current="page"
      :pages="store.pagination.pages"
      @change="goPage"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSessionStore } from '../stores/sessions.js'
import SessionCard    from '../components/SessionCard.vue'
import SessionFilters from '../components/SessionFilters.vue'
import PaginationBar  from '../components/PaginationBar.vue'

const store = useSessionStore()
const page  = ref(1)

const filters = ref({ search: '', technique: '', dateFrom: '', dateTo: '' })

function fetchData() {
  store.fetchSessions({
    page: page.value,
    search:    filters.value.search    || undefined,
    technique: filters.value.technique || undefined,
    dateFrom:  filters.value.dateFrom  || undefined,
    dateTo:    filters.value.dateTo    || undefined
  })
}

let timer
watch(filters, () => {
  clearTimeout(timer)
  timer = setTimeout(() => { page.value = 1; fetchData() }, 320)
}, { deep: true })

function goPage(n) { page.value = n; fetchData() }

function resetFilters() {
  filters.value = { search: '', technique: '', dateFrom: '', dateTo: '' }
  page.value = 1
}

onMounted(fetchData)
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