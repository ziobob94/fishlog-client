<template>
  <div>
    <PageHeader :title="t('leaderboard.title')" back />

    <div class="tabs" role="tablist">
      <button
        v-for="p in PERIODS" :key="p" type="button" role="tab" :aria-selected="period === p"
        class="tab-pill" :class="{ active: period === p }" @click="period = p"
      >{{ t(`leaderboard.periods.${p}`) }}</button>
    </div>

    <div v-if="loading" class="state-center"><div class="m-spinner"></div></div>

    <p v-else-if="!rows.length" class="text-muted text-sm py-6 text-center">{{ t('leaderboard.empty') }}</p>

    <template v-else>
      <!-- Podio: 2° · 1° · 3° -->
      <ol v-if="podium.length" class="podium" :aria-label="t('leaderboard.title')">
        <li v-for="p in podium" :key="p.r.userId" class="podium-slot" :class="[`podium-${p.pos}`, { me: p.r.userId === auth.user?._id }]">
          <RouterLink :to="`/users/${p.r.userId}`" class="contents">
          <img v-if="p.r.avatar" :src="p.r.avatar" class="podium-avatar" :alt="''" />
          <span v-else class="podium-avatar podium-placeholder">{{ initials(p.r.displayName) }}</span>
          <span class="podium-name">{{ p.r.displayName }}</span>
          <span class="podium-score font-mono">{{ p.r.score }}</span>
          <span class="podium-pos">{{ p.pos }}</span>
          </RouterLink>
        </li>
      </ol>

      <ol class="leaderboard-list">
        <li v-for="(r, i) in rest" :key="r.userId" class="leaderboard-row" :class="{ 'leaderboard-row-me': r.userId === auth.user?._id }">
          <span class="rank">{{ i + (rows.length < 3 ? 1 : 4) }}</span>
          <RouterLink :to="`/users/${r.userId}`" class="contents">
          <img v-if="r.avatar" :src="r.avatar" class="mini-avatar" :alt="''" />
          <span v-else class="mini-placeholder">{{ initials(r.displayName) }}</span>
          <div class="leaderboard-info">
            <span class="leaderboard-name">{{ r.displayName }}<span v-if="r.userId === auth.user?._id" class="you-badge">{{ t('leaderboard.you') }}</span></span>
            <span class="leaderboard-meta text-muted">
              {{ t('leaderboard.sessionsCount', { n: r.sessionsCount }) }} · {{ t('leaderboard.catchesCount', { n: r.catchesCount }) }}
            </span>
          </div>
          </RouterLink>
          <span class="leaderboard-score font-mono">{{ r.score }}</span>
        </li>
      </ol>

      <p class="formula-note">{{ t('leaderboard.formula') }}</p>
    </template>
  </div>
</template>

<script setup>
import { toInitials } from '../utils/initials.js'
import PageHeader from '../components/PageHeader.vue'
import { ref, computed, watch } from 'vue'
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
const podium = computed(() => {
  const r = rows.value
  if (r.length < 3) return []
  return [{ r: r[1], pos: 2 }, { r: r[0], pos: 1 }, { r: r[2], pos: 3 }]
})
const rest = computed(() => (rows.value.length < 3 ? rows.value : rows.value.slice(3)))

function initials(name) {
  return toInitials(name || '?')
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
  @apply flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted bg-transparent border-none rounded-full cursor-pointer px-3 min-h-[44px] transition-colors whitespace-nowrap;
}
.tab-pill:hover { @apply text-foam; }
.tab-pill.active { @apply text-on-primary bg-ocean; }

.formula-note {
  @apply text-xs text-muted mt-4;
}

.leaderboard-list {
  @apply flex flex-col gap-2 list-none p-0 m-0;
}

.leaderboard-row {
  @apply flex items-center gap-3 px-4 min-h-[60px] bg-surface border border-border/60 rounded-xl;
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
  @apply w-10 h-10 rounded-full object-cover shrink-0;
}

.mini-placeholder {
  @apply w-10 h-10 rounded-full border border-ocean text-ocean-text flex items-center justify-center text-xs font-bold shrink-0;
  background: var(--ocean-glow);
}

.leaderboard-info {
  @apply flex flex-col min-w-0 flex-1;
}

.leaderboard-name {
  @apply text-sm font-semibold text-foam truncate flex items-center gap-1.5;
}

.you-badge {
  @apply text-[0.65rem] font-bold uppercase tracking-wide bg-ocean text-on-primary rounded-full px-1.5 py-0.5;
}

.leaderboard-meta {
  @apply text-xs truncate;
}

.leaderboard-score {
  @apply text-xl font-medium text-foam shrink-0;
}
.podium { @apply grid grid-cols-3 items-end gap-2 list-none p-0 mb-4; }
.podium-slot { @apply flex flex-col items-center gap-1 px-2 py-4 bg-surface border border-border/60 rounded-xl min-w-0; }
.podium-1 { @apply py-6 border-sand; background: rgb(var(--color-sand) / 0.1); }
.podium-slot.me { @apply border-ocean; }
.podium-avatar { @apply w-12 h-12 rounded-full object-cover shrink-0; }
.podium-1 .podium-avatar { @apply w-14 h-14; }
.podium-placeholder { @apply border border-ocean text-ocean-text flex items-center justify-center text-sm font-bold; background: var(--ocean-glow); }
.podium-1 .podium-placeholder { @apply border-sand text-sand-text; background: rgb(var(--color-sand) / 0.15); }
.podium-name { @apply text-sm font-bold text-foam max-w-full truncate; }
.podium-score { @apply text-xl text-foam; }
.podium-1 .podium-score { @apply text-3xl text-sand-text; }
.podium-pos { @apply inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-2 text-xs font-bold text-foam; }
.podium-2 .podium-pos { background: #cbd5e1; @apply text-on-primary; }
.podium-3 .podium-pos { background: #c08457; @apply text-on-primary; }
.podium-1 .podium-pos { @apply bg-sand text-on-primary; }
</style>
