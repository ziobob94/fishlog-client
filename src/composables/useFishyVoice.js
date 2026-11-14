import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '../stores/sessions.js'
import { useOfflineStore } from '../stores/offline.js'
import { useSpeech, isIOS } from './useSpeech.js'
import { useToast } from './useToast.js'
import { useFishySheet } from './useFishySheet.js'
import { createFishyConversation } from './fishyConversation.js'
import { fabState, queuedCount, bumpUses, readUses, INTRO_USES, formatElapsed } from '../utils/fishyFab.js'
import { summarizeCatch, cleanTranscript } from '../utils/voiceCatch.js'

// Stato condiviso di Fishy: lo usano il pulsante (FishyFab), il foglio e la riga della scheda uscita, così l'ascolto
// continua anche se si chiude il foglio e l'esito arriva comunque (toast sopra la tab bar).
// Non cambia API né interpretazione: parla con store.askFishy come prima.
const conversation = createFishyConversation({ undo: r => useSessionStore().undoAction(r) })
const busy = ref(false)
const flash = ref(null)        // 'success' | 'error', per un istante
const issue = ref(null)        // 'rate_limit' | 'ai_down' | 'offline' | 'degraded' | 'mic_denied' | 'speech_error' | 'error'
const issueText = ref('')
const announcement = ref('')   // letto da aria-live="polite"
const elapsed = ref(0)
const uses = ref(readUses())
let speech = null
let t = (k) => k
let tick = null
let flashTimer = null

const setFlash = (v) => { flash.value = v; clearTimeout(flashTimer); flashTimer = setTimeout(() => { flash.value = null }, 2500) }
const buzz = () => { try { if (!isIOS() && localStorage.getItem('fishy.haptics') !== 'off') navigator.vibrate?.(15) } catch { /* non supportata */ } }
const hhmm = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

function init() {
  if (speech) return
  ;({ t } = useI18n())
  speech = useSpeech({
    onResult: text => submit({ text }),
    onError: code => {
      const denied = code === 'not-allowed' || code === 'service-not-allowed'
      issue.value = denied ? 'mic_denied' : 'speech_error'
      issueText.value = t(denied ? 'fishy.state.micDenied' : 'fishy.state.speechError')
      announcement.value = issueText.value
      setFlash('error')
    }
  })
  if (typeof document !== 'undefined') {
    // In background il timer dell'annullo potrebbe non scattare mai: lo saldiamo subito.
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') conversation.flush() })
    window.addEventListener('pagehide', () => conversation.flush())
  }
}

function startListening() {
  if (!speech?.supported || busy.value || speech.listening.value) return
  issue.value = null
  speech.start()
  if (!speech.listening.value) return
  elapsed.value = 0
  const t0 = Date.now()
  clearInterval(tick); tick = setInterval(() => { elapsed.value = Date.now() - t0; if (!speech.listening.value) { clearInterval(tick); tick = null } }, 250)
  announcement.value = t('voice.listeningAnnounce'); buzz()
}
const finish = () => speech?.stop()          // tocca per finire: la frase parte
const cancelListening = () => { speech?.cancel(); announcement.value = t('fishy.cancelled') }
const toggle = () => { if (speech?.listening.value) finish(); else startListening() }

function describe(r) {
  const act = r.action || 'catch'
  if (act === 'start_session') return { kind: 'start', title: t('fishy.row.start'), parts: [{ text: r.auto ? t('fishy.startedAutoShort') : (r.session?.location || '') }] }
  if (act === 'change_bait') return { kind: 'bait', title: t('fishy.row.bait'), parts: [{ text: r.bait }] }
  if (act === 'end_session') return { kind: 'end', title: t('fishy.row.end'), parts: [] }
  const c = r.catch
  const parts = [{ text: c.species }]
  if (c.weightKg) parts.push({ text: `${String(c.weightKg).replace('.', ',')} kg`, mono: true })
  if (c.lengthCm) parts.push({ text: `${String(c.lengthCm).replace('.', ',')} cm`, mono: true })
  if (c.released) parts.push({ text: t('session.ongoing.releasedLower') })
  return { kind: 'catch', title: t('fishy.row.catch'), parts, toComplete: !!c.toComplete, alias: r.matchedAlias }
}

// Frase di Fishy composta dal client: «Registrata: spigola 2 kg» oppure «Fatto: 3 azioni».
function sentence(rows) {
  if (rows.length > 1) return t('fishy.done', { n: rows.length }, rows.length)
  const r = rows[0].result
  return (r.action || 'catch') === 'catch' ? `${t('voice.saved')}: ${summarizeCatch(r.catch, t('session.ongoing.releasedLower'))}` : rows[0].title
}

async function submit({ text, species, force }) {
  const clean = cleanTranscript(text)
  if (!clean || busy.value) return
  init()
  const store = useSessionStore()
  busy.value = true; issue.value = null
  announcement.value = t('voice.thinking')
  // Nessuno storico: il nuovo comando sostituisce lo scambio precedente (frase, azioni, domande).
  conversation.clear(); store.voiceNeedsInfo = []
  const ex = conversation.start(clean)
  const time = hhmm()
  uses.value = bumpUses()
  try {
    const res = await store.askFishy({ text: clean, time, species, force })
    if (res.queued) {
      issue.value = res.reason === 'ai_rate_limit' ? 'rate_limit' : res.reason === 'ai_unavailable' ? 'ai_down' : 'offline'
      issueText.value = t(issue.value === 'rate_limit' ? 'voice.rateLimited' : issue.value === 'ai_down' ? 'voice.aiDown' : 'voice.savedForLater')
      announcement.value = issueText.value
      if (!useFishySheet().open.value) useToast().toast(issueText.value, { type: 'info', duration: 7000 })
      return
    }
    if (res.error) { issue.value = 'error'; issueText.value = res.error; announcement.value = res.error; setFlash('error'); return }
    if (res.degraded) { issue.value = 'degraded'; issueText.value = t('voice.simplified') }
    for (const r of res.results) {
      if (r.status === 'saved') {
        const row = conversation.addRow({ result: r, time, id: crypto.randomUUID(), sessionId: r.sessionId, ...describe(r) })
        if (row.kind === 'catch' && row.toComplete && r.catch?._id) {
          const idx = (store.current?.catches || []).findIndex(x => x._id === r.catch._id)
          row.completeTo = idx >= 0 ? `/session/${r.sessionId}/catch/${idx}` : null
        }
      } else if (r.status === 'info' && r.message) ex.notes.push(r.message)
    }
    if (ex.rows.length) {
      announcement.value = sentence(ex.rows); setFlash('success'); buzz()
      if (!useFishySheet().open.value) toastDone(ex)
    } else if (!store.voiceNeedsInfo.length && ex.notes.length) announcement.value = ex.notes[0]
    else if (store.voiceNeedsInfo.length) announcement.value = store.voiceNeedsInfo[0].question || t('fishy.state.notUnderstood')
  } finally { busy.value = false }
}

// Foglio chiuso: toast sopra la tab bar con Annulla (e poi Ripristina, come nel foglio).
function toastDone(ex) {
  const { toast } = useToast()
  const rows = ex.rows
  toast(sentence(rows), {
    type: rows.some(r => r.toComplete) ? 'warning' : 'success', duration: 8000,
    action: { label: t('voice.undo'), onClick: () => {
      rows.forEach(r => conversation.undoRow(r))
      toast(t('fishy.undone'), { type: 'info', duration: 6000, action: { label: t('fishy.restore'), onClick: () => rows.forEach(r => conversation.restoreRow(r)) } })
    } }
  })
}

export function useFishyVoice() {
  init()
  const offline = useOfflineStore()
  const queued = computed(() => queuedCount(offline.outbox))
  const listening = computed(() => !!speech?.listening.value)
  const state = computed(() => fabState({
    listening: listening.value, busy: busy.value,
    error: flash.value === 'error', success: flash.value === 'success',
    limit: issue.value === 'rate_limit' || issue.value === 'ai_down',
    queued: queued.value, offline: typeof navigator !== 'undefined' && navigator.onLine === false,
    introLeft: Math.max(0, INTRO_USES - uses.value)
  }))
  return {
    conversation, state, busy, issue, issueText, announcement, queued, uses, listening,
    supported: speech.supported, interim: speech.interim,
    elapsedLabel: computed(() => formatElapsed(elapsed.value)),
    startListening, finish, cancelListening, toggle, submit
  }
}
