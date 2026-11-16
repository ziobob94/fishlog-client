<template>
  <div class="ongoing">

    <!-- Testata (mockup 34): freccia, riepilogo e dati uscita nell'angolo, luogo, statistiche -->
    <section class="hero">
      <svg class="hero-bg" viewBox="0 0 400 240" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <g fill="none" stroke="#7dd3fc" stroke-width="1.5" stroke-linejoin="round">
          <path opacity=".12" d="M250-10c80 0 160 45 170 120s-40 140-120 150-170-20-190-100S170-10 250-10Z" />
          <path opacity=".2" d="M255 14c60 0 125 38 132 96s-30 110-95 124-135-12-152-80S198 14 255 14Z" />
          <path opacity=".3" d="M260 40c40 0 80 30 85 70s-20 80-70 90-100-10-110-55 55-105 95-105Z" />
          <path opacity=".42" d="M262 66c28 0 55 22 58 50s-14 56-48 62-70-8-76-38 38-74 66-74Z" />
        </g>
      </svg>
      <div class="hero-top">
        <RouterLink to="/sessions" class="back" :aria-label="t('session.ongoing.backToList')"><ChevronLeft :size="22" /></RouterLink>
      </div>
      <div class="hero-text">
        <span class="eyebrow"><span class="dot"></span>{{ t('session.ongoing.live', { time: startLabel }) }}</span>
        <h1>{{ session.location?.name || session.title || t('session.untitled') }}</h1>
        <span v-if="subline" class="fl-mono subline">{{ subline }}</span>
      </div>
      <div class="stats">
        <div><span class="fl-mono num">{{ catches.length }}</span><span class="lbl">{{ t('session.ongoing.statCatches') }}</span></div>
        <div><span class="fl-mono num">{{ totalKg }}</span><span class="lbl">{{ t('session.ongoing.statKg') }}</span></div>
        <div><span class="fl-mono num amber">{{ elapsed }}</span><span class="lbl">{{ t('session.ongoing.statHours') }}</span></div>
      </div>
    </section>

    <main class="body">
      <RouterLink :to="`/session/${session._id}/catch/new`" class="fl-btn1 add-btn">
        <Plus :size="24" :stroke-width="2.4" /> {{ t('session.ongoing.addCatch') }}
      </RouterLink>
      <div class="actions">
        <button type="button" class="fl-btn2" @click="$emit('edit-full')"><Pencil :size="20" aria-hidden="true" /> {{ t('session.ongoing.editData') }}</button>
        <RouterLink :to="`/session/${session._id}`" class="fl-btn2"><FileText :size="20" aria-hidden="true" /> {{ t('session.edit.viewSummary') }}</RouterLink>
      </div>

      <!-- Stato vuoto: il galleggiante -->
      <div v-if="!catches.length" class="empty">
        <Bobber :size="96" />
        <span class="empty-title">{{ t('session.ongoing.emptyTitle') }}</span>
        <span class="empty-text">{{ t('session.ongoing.emptyText') }}</span>
      </div>

      <section v-else class="list">
        <div class="list-head">
          <span class="fl-lab" style="margin:0">{{ t('session.ongoing.catchesTitle') }}</span>
          <svg class="wave" height="12" aria-hidden="true">
            <defs><pattern id="uw" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0 6c3 0 3-4 6-4s3 4 6 4 3 4 6 4 3-4 6-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></pattern></defs>
            <rect width="100%" height="12" fill="url(#uw)" />
          </svg>
          <span class="saved"><Check :size="14" /> {{ t('session.ongoing.saved') }}</span>
        </div>
        <RouterLink v-for="(c, i) in catches" :key="c._id || i" :to="`/session/${session._id}/catch/${i}`" class="card-row">
          <CatchThumb :media="c.media" />
          <span class="row-main">
            <span class="row-name">{{ c.species }}</span>
            <span class="fl-mono row-size">{{ measures(c) }}</span>
            <span class="row-time">{{ [c.time, c.released ? t('session.ongoing.releasedLower') : ''].filter(Boolean).join(' · ') }}</span>
          </span>
          <ChevronRight :size="20" class="go" />
        </RouterLink>
      </section>
    </main>

    <div class="fl-bar bar-row">
      <button type="button" class="fishy-btn" @click="voice.talk()">
        <Fishy expression="rest" :size="40" avatar />
        <span class="fishy-txt">
          <span class="fishy-title">{{ t('session.ongoing.talkToFishy') }}</span>
          <span class="fishy-ex">{{ t('session.ongoing.fishyExample') }}</span>
        </span>
      </button>
      <RouterLink :to="`/session/${session._id}/close`" class="close-btn" :aria-label="t('session.ongoing.close')">
        <Flag :size="20" aria-hidden="true" />
        <span>{{ t('session.ongoing.closeShort') }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, ChevronRight, ChevronLeft, FileText, Pencil, Flag, Check } from 'lucide-vue-next'
import Bobber from '../Bobber.vue'
import CatchThumb from '../CatchThumb.vue'
import Fishy from '../Fishy.vue'
import { useFishyVoice } from '../../composables/useFishyVoice.js'
import { sessionStart, fmtClock, elapsedLabel, totalKgLabel } from '../../utils/sessionTime.js'

const { t } = useI18n()
const voice = useFishyVoice()

const props = defineProps({
  session: { type: Object, required: true }
})
defineEmits(['cancel', 'closed', 'edit-full'])

const catches = computed(() => props.session.catches || [])
const totalKg = computed(() => totalKgLabel(catches.value))
const startLabel = computed(() => fmtClock(sessionStart(props.session)))

const subline = computed(() => {
  const c = props.session.location?.coords
  const tech = props.session.technique ? props.session.technique.charAt(0).toUpperCase() + props.session.technique.slice(1) : ''
  return [c?.lat && c?.lng ? `${Number(c.lat).toFixed(2)}°N · ${Number(c.lng).toFixed(2)}°E` : '', tech].filter(Boolean).join(' · ')
})

function measures(c) {
  const parts = []
  if (c.lengthCm) parts.push(`${String(c.lengthCm).replace('.', ',')} cm`)
  if (c.weightKg) parts.push(`${String(c.weightKg).replace('.', ',')} kg`)
  return parts.join(' · ') || t('session.ongoing.noDetails')
}

const now = ref(Date.now())
let timer = null
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 30000) })
onBeforeUnmount(() => clearInterval(timer))
const elapsed = computed(() => elapsedLabel(props.session, now.value))
</script>

<style scoped>
.ongoing { display: flex; flex-direction: column; margin: -1.5rem -1rem 0; padding-bottom: calc(64px + 20px + 24px + env(safe-area-inset-bottom)); }
@media (min-width: 640px) { .ongoing { margin: -2rem -1.5rem 0; } }

.hero { position: relative; background: rgb(var(--color-sea-deep)); border-radius: 0 0 28px 8px; overflow: hidden; padding: 8px 16px 22px 8px; display: flex; flex-direction: column; gap: 14px; }
.hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.hero-top { position: relative; display: flex; align-items: center; gap: 4px; }
.back { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: var(--foam); }
.hero-text { position: relative; padding-left: 8px; display: flex; flex-direction: column; gap: 6px; }
.eyebrow { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: rgb(var(--color-sand-text)); }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--sand); }
.hero h1 { margin: 0; overflow-wrap: anywhere; font-size: 28px; line-height: 1.1; letter-spacing: -.01em; font-weight: 800; color: var(--foam); }
.subline { font-size: 12px; color: rgb(var(--color-ocean-text)); }
.stats { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding-left: 8px; }
.stats > div { display: flex; flex-direction: column; gap: 2px; }
.num { font-size: 32px; line-height: 1; letter-spacing: -.04em; color: var(--foam); }
.num.amber { color: rgb(var(--color-sand-text)); }
.lbl { font-size: 12px; color: var(--text-muted); font-weight: 600; }

.body { padding: 18px 16px 0; display: flex; flex-direction: column; gap: 16px; }
.actions { display: flex; gap: 10px; margin-top: -6px; }
.actions .fl-btn2 { flex: 1 1 0; min-width: 0; min-height: 52px; text-decoration: none; }
.add-btn { min-height: 60px; font-size: 17px; box-shadow: 0 8px 22px rgba(14, 165, 233, .28); text-decoration: none; }

.empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px 16px; text-align: center; }
.empty-title { font-size: 18px; font-weight: 800; letter-spacing: -.02em; color: var(--foam); }
.empty-text { font-size: 14px; color: var(--text-muted); line-height: 1.45; max-width: 26ch; }

.list { display: flex; flex-direction: column; gap: 12px; }
.list-head { display: flex; align-items: center; gap: 12px; }
.wave { flex: 1; min-width: 0; width: 100%; color: var(--border); }
.saved { font-size: 12px; color: rgb(var(--color-success-text)); display: flex; align-items: center; gap: 4px; }
.card-row { display: flex; gap: 12px; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 10px; min-height: 64px; text-decoration: none; color: var(--foam); }
.row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.row-name { font-size: 16px; font-weight: 700; }
.row-size { font-size: 13px; color: rgb(var(--color-sand-text)); }
.row-time { font-size: 12px; color: var(--text-muted); }
.go { color: rgb(var(--color-ocean-text)); flex: none; }

.bar-row { flex-direction: row; gap: 12px; align-items: stretch; }
.fishy-btn { flex: 1; min-width: 0; height: 64px; padding: 0 12px 0 10px; display: flex; align-items: center; gap: 10px; text-align: left; border-radius: 16px; background: var(--surface); border: 1px solid rgb(var(--color-ocean)); color: var(--foam); font: inherit; cursor: pointer; }
.fishy-btn:active { background: var(--surface-2); }
.fishy-txt { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.fishy-title { font-size: 15px; font-weight: 800; }
.fishy-ex { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.close-btn { flex: none; width: 84px; height: 64px; border-radius: 16px; border: 1px solid var(--border-light); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--foam); font-size: 13px; font-weight: 700; text-decoration: none; }
</style>
