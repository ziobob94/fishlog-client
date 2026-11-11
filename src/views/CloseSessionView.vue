<template>
  <div class="close-page">
    <PageHeader :title="t('session.ongoing.close')" back compact />

    <div v-if="!session" class="state-center"><div class="m-spinner"></div></div>

    <div v-else class="close-form">
      <div v-if="error" class="error-banner"><AlertTriangle :size="16" /> {{ error }}</div>

      <div class="summary-card">
        <h3>{{ session.location?.name || session.title || t('session.untitled') }}</h3>
        <p class="fl-mono meta">{{ metaLine }}</p>
        <div class="stats">
          <div><span class="fl-mono num">{{ session.catches?.length || 0 }}</span><span class="lbl">{{ t('session.ongoing.statCatches') }}</span></div>
          <div><span class="fl-mono num">{{ totalKg }}</span><span class="lbl">{{ t('session.ongoing.statKg') }}</span></div>
          <div><span class="fl-mono num amber">{{ hours }}</span><span class="lbl">{{ t('session.ongoing.hoursLabel') }}</span></div>
        </div>
      </div>

      <section>
        <span class="fl-lab">{{ t('session.ongoing.howWent') }}</span>
        <div class="stars">
          <button v-for="n in 5" :key="n" type="button" class="star" :class="{ on: n <= rating }" :aria-label="`${n}`" @click="rating = rating === n ? 0 : n">
            <svg viewBox="0 0 24 24" width="26" height="26" :fill="n <= rating ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7z" /></svg>
          </button>
        </div>
      </section>

      <section>
        <label class="fl-lab" for="close-notes">{{ t('session.ongoing.notesOptional') }}</label>
        <textarea id="close-notes" v-model="notes" class="fl-inp" rows="4" :placeholder="t('session.ongoing.notesPlaceholder')" />
      </section>

      <section>
        <span class="fl-lab">{{ t('session.ongoing.whoCanSee') }}</span>
        <div class="seg">
          <button v-for="v in ['private', 'users', 'group']" :key="v" type="button" :class="{ on: visibility === v }" @click="visibility = v">
            {{ t(`sessionForm.visibility.${v}`) }}
          </button>
        </div>
        <p class="fl-hint vis-hint">{{ t(`session.ongoing.${hintKey}`) }} {{ t('session.ongoing.canEditLater') }}</p>
        <div v-if="visibility === 'group'" class="groups">
          <label v-for="g in groups" :key="g._id" class="group-check">
            <input type="checkbox" :value="g._id" v-model="allowedGroups" /> {{ g.name }}
          </label>
          <span v-if="!groups.length" class="text-muted">{{ t('sessionForm.fields.noGroups') }}</span>
        </div>
      </section>

      <div class="fl-bar">
        <button type="button" class="fl-btn1" :disabled="closing" @click="closeSession">
          <span v-if="closing" class="m-spinner" style="width:15px;height:15px"></span>
          {{ t('session.ongoing.close') }}
        </button>
        <button type="button" class="link-btn" @click="router.replace(`/session/${route.params.id}/edit`)">{{ t('session.ongoing.keepFishing') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertTriangle } from 'lucide-vue-next'
import PageHeader from '../components/PageHeader.vue'
import { elapsedLabel, totalKgLabel } from '../utils/sessionTime.js'
import api from '../utils/api.js'
import { useSessionStore } from '../stores/sessions.js'
import { useToast } from '../composables/useToast.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useSessionStore()
const { toast } = useToast()

const session = computed(() => store.current)
const error = ref(null)
const closing = ref(false)
const rating = ref(0)
const notes = ref('')
const visibility = ref('private')
const allowedGroups = ref([])
const groups = ref([])

const metaLine = computed(() => {
  const c = session.value?.location?.coords
  const d = session.value?.date ? new Date(session.value.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  return [c?.lat && c?.lng ? `${Number(c.lat).toFixed(2)}°N · ${Number(c.lng).toFixed(2)}°E` : '', d].filter(Boolean).join(' · ')
})
const totalKg = computed(() => totalKgLabel(session.value?.catches))
const hours = computed(() => elapsedLabel(session.value))
const hintKey = computed(() => ({ private: 'visPrivateHint', users: 'visUsersHint', group: 'visGroupHint' })[visibility.value])

onMounted(async () => {
  if (store.current?._id !== route.params.id) await store.fetchSession(route.params.id)
  const s = store.current
  if (!s) { router.replace('/sessions'); return }
  rating.value = s.rating || 0
  notes.value = s.notes || ''
  visibility.value = s.visibility || 'private'
  allowedGroups.value = (s.allowedGroups || []).map(g => g._id || g)
  try { const { data } = await api.get('/groups'); groups.value = Array.isArray(data) ? data : (data?.data ?? []) } catch { groups.value = [] }
})

async function closeSession() {
  closing.value = true
  error.value = null
  const result = await store.updateSession(route.params.id, {
    status: 'closed', rating: rating.value, notes: notes.value, visibility: visibility.value,
    allowedGroups: visibility.value === 'group' ? allowedGroups.value : []
  })
  closing.value = false
  if (!result) { error.value = store.error; return }
  toast(t('session.ongoing.closed'), { type: 'success' })
  router.replace('/sessions')
}
</script>

<style scoped>
.close-form { display: flex; flex-direction: column; gap: 22px; max-width: 640px; padding: 4px 0 calc(130px + env(safe-area-inset-bottom)); }
.state-center { display: flex; justify-content: center; padding: 4rem; }
.error-banner { align-items: center; background: rgba(240,80,80,.1); border: 1px solid var(--danger); border-radius: 6px; color: var(--danger); display: inline-flex; gap: .4rem; padding: .75rem 1rem; }
.summary-card { background: rgb(var(--color-sea-deep)); border: 1px solid var(--border); border-radius: 24px 24px 24px 8px; padding: 18px 20px; }
.summary-card h3 { font-family: var(--font-display); color: var(--foam); font-size: 20px; font-weight: 800; letter-spacing: -.01em; margin: 0; }
.meta { color: rgb(var(--color-ocean-text)); font-size: 12px; margin: 4px 0 16px; }
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.stats > div { display: flex; flex-direction: column; gap: 2px; }
.num { color: var(--foam); font-size: 30px; line-height: 1; letter-spacing: -.04em; }
.num.amber { color: rgb(var(--color-sand-text)); }
.lbl { color: var(--text-muted); font-size: 12px; font-weight: 600; }
.stars { display: flex; gap: 8px; }
.star { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; height: 52px; flex: 1; max-width: 64px; padding: 0; }
.star.on { color: rgb(var(--color-sand-text)); border-color: var(--sand); }
.seg { display: grid; gap: 8px; grid-template-columns: repeat(3, 1fr); }
.seg button { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; color: var(--foam); cursor: pointer; font-weight: 700; font-size: 14px; min-height: 52px; }
.seg button.on { background: var(--ocean); border-color: var(--ocean); color: rgb(var(--color-on-primary)); }
.vis-hint { margin-top: 8px; }
.groups { display: flex; flex-direction: column; gap: .5rem; margin-top: .75rem; }
.group-check { align-items: center; display: flex; gap: .5rem; margin: 0; text-transform: none; letter-spacing: 0; }
.later { color: var(--text-muted); font-size: 12px; margin: 0; text-align: center; }
.link-btn { background: none; border: none; color: rgb(var(--color-ocean-text)); cursor: pointer; font-weight: 700; font-size: 15px; min-height: 36px; }
.fl-bar { align-items: stretch; }
</style>
