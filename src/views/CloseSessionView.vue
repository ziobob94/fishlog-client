<template>
  <div class="close-page">
    <PageHeader :title="t('session.ongoing.close')" back />

    <div v-if="!session" class="state-center"><div class="spinner"></div></div>

    <div v-else class="close-form">
      <div v-if="error" class="error-banner"><AlertTriangle :size="16" /> {{ error }}</div>

      <div class="summary-card">
        <h3>{{ session.title || session.location?.name || t('session.untitled') }}</h3>
        <p class="meta">{{ dateLabel }}</p>
        <div class="stats">
          <div><strong>{{ session.catches?.length || 0 }}</strong><span>{{ t('session.ongoing.statCatches') }}</span></div>
          <div><strong>{{ totalKg }}</strong><span>{{ t('session.ongoing.statKg') }}</span></div>
        </div>
      </div>

      <section>
        <h4 class="sec-title">{{ t('session.ongoing.howWent') }}</h4>
        <div class="stars">
          <button v-for="n in 5" :key="n" type="button" class="star" :class="{ on: n <= rating }" :aria-label="`${n}`" @click="rating = rating === n ? 0 : n">★</button>
        </div>
      </section>

      <section>
        <h4 class="sec-title">{{ t('session.ongoing.notesOptional') }}</h4>
        <textarea v-model="notes" rows="4" :placeholder="t('session.ongoing.notesPlaceholder')" />
      </section>

      <section>
        <h4 class="sec-title">{{ t('session.ongoing.whoCanSee') }}</h4>
        <div class="seg">
          <button v-for="v in ['private', 'users', 'group']" :key="v" type="button" :class="{ on: visibility === v }" @click="visibility = v">
            {{ t(`sessionForm.visibility.${v}`) }}
          </button>
        </div>
        <div v-if="visibility === 'group'" class="groups">
          <label v-for="g in groups" :key="g._id" class="group-check">
            <input type="checkbox" :value="g._id" v-model="allowedGroups" /> {{ g.name }}
          </label>
          <span v-if="!groups.length" class="text-muted">{{ t('sessionForm.fields.noGroups') }}</span>
        </div>
      </section>

      <div class="close-actions">
        <button type="button" class="btn btn-primary save-btn" :disabled="closing" @click="closeSession">
          <span v-if="closing" class="spinner" style="width:15px;height:15px"></span>
          {{ t('session.ongoing.close') }}
        </button>
        <button type="button" class="link-btn" @click="router.replace(`/session/${route.params.id}/edit`)">{{ t('session.ongoing.keepFishing') }}</button>
        <p>{{ t('session.ongoing.canEditLater') }}</p>
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

const dateLabel = computed(() => session.value?.date ? new Date(session.value.date).toLocaleDateString() : '')
const totalKg = computed(() => {
  const kg = (session.value?.catches || []).reduce((s, c) => s + (Number(c.weightKg) || 0), 0)
  return (Math.round(kg * 10) / 10).toString().replace('.', ',')
})

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
  router.replace(`/session/${route.params.id}`)
}
</script>

<style scoped>
.close-form { display: flex; flex-direction: column; gap: 1.25rem; max-width: 640px; padding-bottom: 2rem; }
.state-center { display: flex; justify-content: center; padding: 4rem; }
.error-banner { align-items: center; background: rgba(240,80,80,.1); border: 1px solid var(--danger, #f05050); border-radius: 6px; color: var(--danger, #f05050); display: inline-flex; gap: .4rem; padding: .75rem 1rem; }
.summary-card { background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55); border-radius: 16px; padding: 1rem 1.1rem; }
.summary-card h3 { color: var(--foam, #cde); font-size: 1.2rem; margin: 0; }
.meta { color: var(--text-muted, #6b8fa8); font-size: .85rem; margin: .2rem 0 .8rem; }
.stats { display: flex; gap: 2rem; }
.stats div { display: flex; flex-direction: column; }
.stats strong { color: var(--foam, #cde); font-family: monospace; font-size: 1.8rem; }
.stats span { color: var(--text-muted, #6b8fa8); font-size: .78rem; }
.sec-title { color: var(--text-muted, #6b8fa8); font-size: .75rem; font-weight: 800; letter-spacing: .06em; margin-bottom: .5rem; text-transform: uppercase; }
.stars { display: flex; gap: .5rem; }
.star { background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55); border-radius: 12px; color: var(--text-muted, #6b8fa8); cursor: pointer; font-size: 1.5rem; height: 52px; width: 52px; }
.star.on { color: var(--sand); }
.seg { display: grid; gap: .5rem; grid-template-columns: repeat(3, 1fr); }
.seg button { background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55); border-radius: 10px; color: var(--foam, #cde); cursor: pointer; font-weight: 700; min-height: 48px; }
.seg button.on { background: var(--ocean, #0ea5e9); border-color: var(--ocean, #0ea5e9); color: rgb(var(--color-on-primary)); }
.groups { display: flex; flex-direction: column; gap: .5rem; margin-top: .75rem; }
.group-check { align-items: center; display: flex; gap: .5rem; }
.close-actions { align-items: center; display: flex; flex-direction: column; gap: .5rem; }
.close-actions p { color: var(--text-muted, #6b8fa8); font-size: .78rem; }
.save-btn { min-height: 52px; width: 100%; }
.link-btn { background: none; border: none; color: var(--ocean, #0ea5e9); cursor: pointer; font-weight: 600; padding: .6rem; }
</style>
