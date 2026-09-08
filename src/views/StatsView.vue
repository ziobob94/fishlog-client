<template>
  <div>
    <div v-if="loading" class="state-center"><div class="spinner"></div></div>

    <div v-else class="stats-grid">
      <div class="card stat-card">
        <span class="stat-value">{{ stats.totalSessions || 0 }}</span>
        <span class="stat-label">{{ t('stats.totalSessions') }}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-value">{{ stats.totalCatches || 0 }}</span>
        <span class="stat-label">{{ t('stats.totalCatches') }}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-value">{{ avgRating }}</span>
        <span class="stat-label">{{ t('stats.avgRating') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../utils/api.js'

const { t } = useI18n()
const loading = ref(true)
const stats = ref({})

const avgRating = computed(() => stats.value.avgRating ? stats.value.avgRating.toFixed(1) : '—')

onMounted(async () => {
  try {
    const { data } = await api.get('/sessions/stats')
    stats.value = data
  } finally { loading.value = false }
})
</script>

<style scoped>
.stats-grid  { @apply grid gap-4; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.stat-card   { @apply flex flex-col items-center justify-center gap-1 py-8; }
.stat-value  { @apply text-3xl font-extrabold text-ocean; }
.stat-label  { @apply text-sm text-muted; }
</style>
