<template>
  <div>
    <div class="page-header">
      <h2 class="icon-inline"><Trophy :size="20" /> {{ t('leaderboard.title') }}</h2>
    </div>

    <div class="tabs" role="tablist">
      <button
        v-for="p in PERIODS" :key="p" type="button" role="tab" :aria-selected="period === p"
        class="tab-pill" :class="{ active: period === p }" @click="period = p"
      >{{ t(`leaderboard.periods.${p}`) }}</button>
    </div>

    <p class="formula-note">{{ t('leaderboard.formula') }}</p>

    <div v-if="loading" class="state-center"><div class="spinner"></div></div>

    <p v-else-if="!rows.length" class="text-muted text-sm py-6 text-center">{{ t('leaderboard.empty') }}</p>

    <ol v-else class="leaderboard-list">
      <li v-for="(r, i) in rows" :key="r.userId" class="leaderboard-row card" :class="{ 'leaderboard-row-me': r.userId === auth.user?._id, 'leaderboard-row-podium': i < 3 }">
        <span class="rank" :class="`rank-${i + 1}`">{{ i + 1 }}</span>
        <img v-if="r.avatar" :src="r.avatar" class="mini-avatar" />
        <span v-else class="mini-placeholder">{{ initials(r.displayName) }}</span>
        <div class="leaderboard-info">
          <span class="leaderboard-name">{{ r.displayName }}<span v-if="r.userId === auth.user?._id" class="you-badge">{{ t('leaderboard.you') }}</span></span>
          <span class="leaderboard-meta text-muted">
            {{ t('leaderboard.sessionsCount', { n: r.sessionsCount }) }} · {{ t('leaderboard.catchesCount', { n: r.catchesCount }) }}
          </span>
        </div>
        <span class="leaderboard-score">{{ r.score }}</span>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trophy } from 'lucide-vue-next'
import { useSessionStore } from '../stores/sessions.js'
import { useAuthStore } from '../stores/auth.js'

const { t } = useI18n()
const sessions = useSessionStore()
const auth = useAuthStore()

const PERIODS = ['week', 'month', 'all']
const period = ref('week')
const rows = ref([])
const loading = ref(true)

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

async function load() {
  loading.value = true
  try {
    rows.value = await sessions.fetchLeaderboard(period.value)
  } finally {
    loading.value = false
  }
}

watch(period, load, { immediate: true })
</script>

<style scoped>
.page-header {
  @apply flex items-center gap-4 mb-4;
}

.icon-inline {
  @apply inline-flex items-center gap-2;
}

.tabs {
  @apply flex gap-1 p-1 mb-2 bg-surface-2 rounded-full w-full sm:w-auto;
}
.tab-pill {
  @apply flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted bg-transparent border-none rounded-full cursor-pointer px-3 py-1.5 transition-colors whitespace-nowrap;
}
.tab-pill:hover { @apply text-foam; }
.tab-pill.active { @apply text-ink bg-ocean; }

.formula-note {
  @apply text-xs text-muted italic mb-4;
}

.leaderboard-list {
  @apply flex flex-col gap-2 list-none p-0 m-0;
}

.leaderboard-row {
  @apply flex items-center gap-3 py-2.5;
}

.leaderboard-row-podium {
  @apply border-sand/40;
}

.leaderboard-row-me {
  @apply border-ocean;
}

.rank {
  @apply w-7 text-center text-sm font-bold text-muted shrink-0;
}

.rank-1 { @apply text-sand text-lg; }
.rank-2 { @apply text-foam; }
.rank-3 { color: rgb(var(--color-sand) / 0.7); }

.mini-avatar {
  @apply w-9 h-9 rounded-full object-cover shrink-0;
}

.mini-placeholder {
  @apply w-9 h-9 rounded-full border border-ocean text-ocean flex items-center justify-center text-xs font-bold shrink-0;
  background: var(--ocean-glow);
}

.leaderboard-info {
  @apply flex flex-col min-w-0 flex-1;
}

.leaderboard-name {
  @apply text-sm font-semibold text-foam truncate flex items-center gap-1.5;
}

.you-badge {
  @apply text-[0.65rem] font-bold uppercase tracking-wide bg-ocean text-white rounded-full px-1.5 py-0.5;
}

.leaderboard-meta {
  @apply text-xs truncate;
}

.leaderboard-score {
  @apply text-lg font-extrabold text-ocean shrink-0;
}
</style>
