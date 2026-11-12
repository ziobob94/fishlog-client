<template>
  <div class="close-page">
    <PageHeader v-if="page === 'main'" :title="t('session.ongoing.close')" back compact />
    <PageHeader v-else :title="t('sessionMenu.notes')" compact>
      <button type="button" class="hdr-done" @click="page = 'main'">{{ t('sessionMenu.done') }}</button>
    </PageHeader>

    <div v-if="!session" class="state-center"><div class="m-spinner"></div></div>

    <!-- Note: pagina a sé -->
    <div v-else-if="page === 'notes'" class="close-form">
      <section>
        <label class="fl-lab" for="close-notes">{{ t('session.ongoing.notesOptional') }}</label>
        <textarea id="close-notes" ref="notesEl" v-model="notes" class="fl-inp" rows="10" :placeholder="t('session.ongoing.notesPlaceholder')" />
      </section>
      <div class="fl-bar"><button type="button" class="fl-btn1" @click="page = 'main'">{{ t('sessionMenu.done') }}</button></div>
    </div>

    <div v-else class="close-form">
      <div v-if="!online" class="info-banner" role="status"><WifiOff :size="16" /> {{ t('sessionMenu.offline') }}</div>
      <div v-if="error" class="error-banner" role="alert">
        <span class="eb-text"><AlertTriangle :size="16" /> {{ t('sessionMenu.saveError') }}</span>
        <button type="button" class="eb-retry" :disabled="closing || !online" @click="closeSession">{{ t('sessionMenu.retry') }}</button>
      </div>

      <div class="summary-card">
        <h3>{{ session.location?.name || session.title || t('session.untitled') }}</h3>
        <p class="fl-mono meta">{{ metaLine }}</p>
        <div class="stats">
          <div><span class="fl-mono num">{{ session.catches?.length || 0 }}</span><span class="lbl">{{ t('session.ongoing.statCatches') }}</span></div>
          <div><span class="fl-mono num">{{ totalKg }}</span><span class="lbl">{{ t('session.ongoing.statKg') }}</span></div>
          <div><span class="fl-mono num amber">{{ hours }}</span><span class="lbl">{{ t('session.ongoing.hoursLabel') }}</span></div>
        </div>
      </div>

      <h2 class="grp">{{ t('sessionMenu.main') }}</h2>
      <section>
        <span class="fl-lab">{{ t('session.ongoing.howWent') }}</span>
        <div class="stars">
          <button v-for="n in 5" :key="n" type="button" class="star" :class="{ on: n <= rating }" :aria-label="`${n}`" :aria-pressed="n <= rating" @click="rating = rating === n ? 0 : n">
            <svg viewBox="0 0 24 24" width="26" height="26" :fill="n <= rating ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7z" /></svg>
          </button>
        </div>
      </section>

      <h2 class="grp">{{ t('sessionMenu.other') }}</h2>
      <button type="button" class="menu-row" @click="visSheet = true">
        <span class="mr-text"><strong>{{ t('sessionMenu.visibility') }}</strong><small>{{ t(`session.ongoing.${hintKey}`) }}</small></span>
        <span class="mr-val fl-mono">{{ t(`sessionForm.visibility.${visibility}`) }}</span><ChevronRight :size="18" class="mr-go" />
      </button>
      <button type="button" class="menu-row" @click="openNotes">
        <span class="mr-text"><strong>{{ t('sessionMenu.notes') }}</strong><small class="mr-note">{{ notes || t('sessionMenu.notesEmpty') }}</small></span>
        <ChevronRight :size="18" class="mr-go" />
      </button>

      <BottomSheet v-model="visSheet" :label="t('sessionMenu.sheetTitle')">
        <div class="vis-sheet">
          <h2 class="vis-title">{{ t('sessionMenu.sheetTitle') }}</h2>
          <div class="vis-opts" role="radiogroup" :aria-label="t('sessionMenu.visibility')">
            <button v-for="v in ['private', 'users', 'group']" :key="v" type="button" class="vis-opt" :class="{ on: visibility === v }" role="radio" :aria-checked="visibility === v" @click="visibility = v">
              <strong>{{ t(`sessionForm.visibility.${v}`) }}</strong>
              <small>{{ t(`session.ongoing.${({ private: 'visPrivateHint', users: 'visUsersHint', group: 'visGroupHint' })[v]}`) }}</small>
            </button>
          </div>
          <div v-if="visibility === 'group'" class="groups">
            <label v-for="g in groups" :key="g._id" class="group-check">
              <input type="checkbox" :value="g._id" v-model="allowedGroups" /> {{ g.name }}
            </label>
            <span v-if="!groups.length" class="text-muted">{{ t('sessionForm.fields.noGroups') }}</span>
          </div>
          <button type="button" class="fl-btn1" @click="visSheet = false">{{ t('sessionMenu.done') }}</button>
        </div>
      </BottomSheet>

      <div class="fl-bar">
        <button type="button" class="fl-btn1" :disabled="closing || !online" @click="closeSession">
          <span v-if="closing" class="m-spinner" style="width:15px;height:15px"></span>
          {{ t('session.ongoing.close') }}
        </button>
        <button type="button" class="link-btn" @click="router.replace(`/session/${route.params.id}/edit`)">{{ t('session.ongoing.keepFishing') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, WifiOff, ChevronRight } from 'lucide-vue-next'
import BottomSheet from '../components/motion/BottomSheet.vue'
import { useOnline } from '../composables/useOnline.js'
import { useUnsavedGuard } from '../composables/useUnsavedGuard.js'
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
const online = useOnline()
const page = ref('main') // 'main' | 'notes' (Note è una pagina a sé)
const visSheet = ref(false)
const notesEl = ref(null)
const snap = ref('')
const state = () => JSON.stringify([rating.value, notes.value, visibility.value, allowedGroups.value])
const guard = useUnsavedGuard(() => snap.value !== '' && state() !== snap.value)
async function openNotes() { page.value = 'notes'; await nextTick(); notesEl.value?.focus(); window.scrollTo({ top: 0 }) }
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
  snap.value = state()
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
  guard.allowLeave()
  toast(t('session.ongoing.closed'), { type: 'success' })
  router.replace('/sessions')
}
</script>

<style scoped>
.close-form { display: flex; flex-direction: column; gap: 22px; max-width: 640px; padding: 4px 0 calc(130px + env(safe-area-inset-bottom)); }
.state-center { display: flex; justify-content: center; padding: 4rem; }
.error-banner { align-items: center; background: rgba(240,80,80,.1); border: 1px solid var(--danger); border-radius: 14px; color: rgb(var(--color-danger-text)); display: flex; justify-content: space-between; flex-wrap: wrap; gap: .5rem; padding: .75rem 1rem; }
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
.hdr-done { background: none; border: 0; color: rgb(var(--color-ocean-text)); font-weight: 800; min-height: 44px; padding: 0 12px; cursor: pointer; }
.grp { font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); margin: 6px 2px -8px; }
.menu-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 64px; padding: 12px 14px; box-sizing: border-box; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; color: var(--foam); text-align: left; cursor: pointer; }
.mr-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.mr-text strong { font-size: 16px; font-weight: 700; }
.mr-text small { color: var(--text-muted); font-size: 13px; }
.mr-note { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mr-val { font-size: 13px; color: rgb(var(--color-ocean-text)); }
.mr-go { color: var(--text-muted); flex: none; }
.menu-row:focus-visible, .vis-opt:focus-visible, .eb-retry:focus-visible, .hdr-done:focus-visible, .star:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.vis-sheet { display: flex; flex-direction: column; gap: 14px; }
.vis-title { font-size: 22px; font-weight: 800; margin: 6px 0 0; color: var(--foam); }
.vis-opts { display: flex; flex-direction: column; gap: 8px; }
.vis-opt { display: flex; flex-direction: column; gap: 2px; text-align: left; min-height: 64px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; color: var(--foam); cursor: pointer; }
.vis-opt small { color: var(--text-muted); font-size: 13px; }
.vis-opt.on { border-color: rgb(var(--color-ocean-text)); background: rgba(14, 165, 233, .1); }
.eb-text { display: inline-flex; align-items: center; gap: .4rem; font-weight: 600; }
.eb-retry { background: none; border: 1px solid currentColor; border-radius: 10px; color: inherit; cursor: pointer; font-weight: 700; min-height: 44px; padding: 0 14px; }
.info-banner { display: flex; align-items: center; gap: .5rem; background: var(--surface-2); border: 1px solid var(--border-light); border-radius: 14px; color: var(--foam); padding: .75rem 1rem; font-size: 14px; }
.later { color: var(--text-muted); font-size: 12px; margin: 0; text-align: center; }
.link-btn { background: none; border: none; color: rgb(var(--color-ocean-text)); cursor: pointer; font-weight: 700; font-size: 15px; min-height: 36px; }
.fl-bar { align-items: stretch; }
</style>
