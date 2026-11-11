<template>
  <div class="ongoing">

    <!-- Testata: dove sono e quanto ho fatto finora -->
    <div class="hero">
      <p class="live"><span class="dot"></span> {{ t('session.ongoing.live', { time: startLabel }) }}</p>
      <h3>{{ session.location?.name || session.title || t('session.untitled') }}</h3>
      <p v-if="session.technique" class="hero-meta">{{ session.technique }}</p>
      <div class="stats">
        <div><strong>{{ catches.length }}</strong><span>{{ t('session.ongoing.statCatches') }}</span></div>
        <div><strong>{{ totalKg }}</strong><span>{{ t('session.ongoing.statKg') }}</span></div>
        <div><strong class="elapsed">{{ elapsed }}</strong><span>{{ t('session.ongoing.statHours') }}</span></div>
      </div>
    </div>

    <button type="button" class="btn btn-primary add-btn" @click="router.push(`/session/${session._id}/catch/new`)">
      <Plus :size="22" /> {{ t('session.ongoing.addCatch') }}
    </button>

    <section>
      <h4 class="sec-title">{{ t('session.ongoing.catchesTitle') }}</h4>
      <p v-if="!catches.length" class="empty">{{ t('session.ongoing.emptyList') }}</p>
      <ul v-else class="list">
        <li v-for="(c, i) in catches" :key="c._id || i">
          <button type="button" class="row" @click="router.push(`/session/${session._id}/catch/${i}`)">
            <span class="row-icon"><Fish :size="26" /></span>
            <span class="row-main">
              <strong>{{ c.species }}</strong>
              <span class="row-nums">{{ measures(c) }}</span>
              <span v-if="c.time || c.released" class="row-sub">{{ [c.time, c.released ? t('session.ongoing.releasedLower') : ''].filter(Boolean).join(' · ') }}</span>
            </span>
            <ChevronRight :size="18" class="go" />
          </button>
        </li>
      </ul>
    </section>

    <div class="bottom-bar">
      <button type="button" class="btn btn-secondary close-btn" @click="router.push(`/session/${session._id}/close`)">
        {{ t('session.ongoing.close') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, ChevronRight, Fish } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()

const props = defineProps({
  session: { type: Object, required: true }
})
defineEmits(['cancel', 'closed', 'edit-full'])

const catches = computed(() => props.session.catches || [])

const totalKg = computed(() => {
  const kg = catches.value.reduce((s, c) => s + (Number(c.weightKg) || 0), 0)
  return (Math.round(kg * 10) / 10).toString().replace('.', ',')
})

function measures(c) {
  const parts = []
  if (c.lengthCm) parts.push(`${c.lengthCm} cm`)
  if (c.weightKg) parts.push(`${String(c.weightKg).replace('.', ',')} kg`)
  return parts.join(' · ') || t('session.ongoing.noDetails')
}

// Inizio uscita: data + ora di inizio se indicata, altrimenti creazione.
const startedAt = computed(() => {
  const s = props.session
  if (s.date && s.startTime) {
    const d = new Date(s.date)
    const [h, m] = s.startTime.split(':').map(Number)
    d.setHours(h || 0, m || 0, 0, 0)
    return d
  }
  return new Date(s.createdAt || s.date || Date.now())
})
const startLabel = computed(() => startedAt.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

const now = ref(Date.now())
let timer = null
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 30000) })
onBeforeUnmount(() => clearInterval(timer))

const elapsed = computed(() => {
  const mins = Math.max(0, Math.floor((now.value - startedAt.value.getTime()) / 60000))
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`
})
</script>

<style scoped>
.ongoing { display: flex; flex-direction: column; gap: 1.25rem; max-width: 640px; padding-bottom: 6rem; }
.hero { background: linear-gradient(160deg, rgb(var(--color-sea-deep)), var(--surface)); border: 1px solid var(--border, #2a3f55); border-radius: 18px; padding: 1.1rem 1.2rem; }
.live { color: var(--sand); font-size: .72rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.dot { background: var(--sand); border-radius: 50%; display: inline-block; height: 8px; margin-right: .3rem; width: 8px; }
.hero h3 { color: var(--foam, #cde); font-size: 1.5rem; font-weight: 800; margin: .3rem 0 0; }
.hero-meta { color: var(--ocean); font-size: .8rem; margin-top: .2rem; text-transform: capitalize; }
.stats { display: grid; gap: 1rem; grid-template-columns: repeat(3, 1fr); margin-top: 1rem; }
.stats div { display: flex; flex-direction: column; }
.stats strong { color: var(--foam, #cde); font-family: monospace; font-size: 1.8rem; line-height: 1.1; }
.stats strong.elapsed { color: var(--sand); }
.stats span { color: var(--text-muted, #6b8fa8); font-size: .75rem; }
.add-btn { align-items: center; display: flex; font-size: 1.15rem; gap: .5rem; justify-content: center; min-height: 64px; width: 100%; }
.sec-title { color: var(--text-muted, #6b8fa8); font-size: .75rem; font-weight: 800; letter-spacing: .08em; margin-bottom: .6rem; text-transform: uppercase; }
.empty { color: var(--text-muted, #6b8fa8); font-size: .92rem; }
.list { display: flex; flex-direction: column; gap: .6rem; list-style: none; margin: 0; padding: 0; }
.row { align-items: center; background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55); border-radius: 14px; color: var(--foam, #cde); cursor: pointer; display: flex; gap: .9rem; padding: .7rem .9rem; text-align: left; width: 100%; }
.row:hover { border-color: var(--ocean, #0ea5e9); }
.row-icon { align-items: center; background: var(--surface-2); border-radius: 12px; color: var(--ocean); display: flex; height: 56px; justify-content: center; width: 56px; }
.row-main { display: flex; flex: 1; flex-direction: column; gap: .1rem; }
.row-main strong { font-size: 1.05rem; }
.row-nums { color: var(--sand); font-family: monospace; font-size: .9rem; }
.row-sub { color: var(--text-muted, #6b8fa8); font-size: .78rem; }
.go { color: var(--ocean, #0ea5e9); }
.bottom-bar { background: var(--ink); border-top: 1px solid var(--border, #2a3f55); bottom: 0; left: 0; padding: .8rem 1rem calc(.8rem + env(safe-area-inset-bottom)); position: fixed; right: 0; z-index: 50; }
.close-btn { border-color: var(--sand); color: var(--sand); min-height: 50px; width: 100%; }
</style>
