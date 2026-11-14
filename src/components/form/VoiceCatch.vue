<template>
  <section class="voice" :aria-label="t('voice.title')">
    <!-- Domande del server (specie incerta/sconosciuta, frase non capita) -->
    <div v-for="n in notices" :key="n.id" class="notice" role="alert">
      <p class="q">{{ n.question }}</p>
      <p v-if="n.text" class="heard">«{{ n.text }}»</p>
      <div class="chips">
        <button v-for="c in (n.candidates || [])" :key="c" type="button" class="fl-chip" :disabled="busy" @click="answer(n, { species: c })">{{ c }}</button>
        <button v-if="n.reason === 'species_unknown' && n.asked" type="button" class="fl-chip" :disabled="busy" @click="answer(n, { species: n.asked, force: true })">{{ t('voice.useAnyway', { name: n.asked }) }}</button>
        <button type="button" class="fl-chip ghost" @click="store.dismissVoiceNeedsInfo(n.id)">{{ t('voice.dismiss') }}</button>
      </div>
    </div>

    <p v-if="queued" class="queued" role="status"><WifiOff :size="14" /> {{ t('voice.queued', { n: queued }) }}</p>
    <p v-if="localSession" class="queued" role="status">{{ t('voice.localSession') }}</p>

    <div class="row">
      <button
        v-if="speech.supported"
        type="button" class="mic" :class="{ on: speech.listening.value, busy }"
        :disabled="busy || localSession" :aria-label="t('voice.holdAria')"
        @pointerdown.prevent="press" @pointerup="release" @pointercancel="release" @pointerleave="release" @contextmenu.prevent
        @keydown.space.prevent="press" @keyup.space.prevent="release"
      >
        <Loader2 v-if="busy" :size="24" class="spin" /><Mic v-else :size="24" />
        <span>{{ label }}</span>
      </button>
      <button type="button" class="kbd fl-iconbtn" :disabled="busy || localSession" :aria-label="t('voice.typeAria')" :title="t('voice.typeAria')" @click="typing = !typing"><Keyboard :size="20" /></button>
    </div>
    <p v-if="speech.listening.value && speech.interim.value" class="interim" aria-live="polite">{{ speech.interim.value }}</p>

    <form v-if="typing || !speech.supported" class="type" @submit.prevent="sendTyped">
      <input v-model="typed" class="fl-inp" type="text" maxlength="600" :placeholder="t('voice.placeholder')" :aria-label="t('voice.placeholder')" :disabled="busy || localSession" />
      <button type="submit" class="fl-btn2" :disabled="busy || localSession || !typed.trim()">{{ t('voice.send') }}</button>
    </form>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Mic, Keyboard, Loader2, WifiOff } from 'lucide-vue-next'
import { useSessionStore } from '../../stores/sessions.js'
import { useOfflineStore } from '../../stores/offline.js'
import { useSpeech } from '../../composables/useSpeech.js'
import { useToast } from '../../composables/useToast.js'
import { summarizeCatch, cleanTranscript } from '../../utils/voiceCatch.js'

const props = defineProps({ session: { type: Object, required: true } })
const { t } = useI18n()
const router = useRouter()
const store = useSessionStore()
const offline = useOfflineStore()
const { toast, dismiss } = useToast()

const busy = ref(false)
const typing = ref(false)
const typed = ref('')
const localSession = computed(() => String(props.session._id).startsWith('local-'))
const notices = computed(() => store.voiceNeedsInfo.filter(n => n.sessionId === props.session._id))
const queued = computed(() => offline.outbox.filter(i => i.meta.kind === 'voice-catch' && i.meta.sessionId === props.session._id).length)

const speech = useSpeech({
  onResult: text => submit({ text }),
  onError: code => toast(code === 'not-allowed' || code === 'service-not-allowed' ? t('voice.micDenied') : t('voice.speechError'), { type: 'warning' })
})
const label = computed(() => busy.value ? t('voice.thinking') : speech.listening.value ? t('voice.listening') : t('voice.hold'))

function press() { if (!busy.value) speech.start() }
function release() { if (speech.listening.value) speech.stop() }
function sendTyped() { const text = typed.value; typed.value = ''; submit({ text }) }
function answer(n, extra) { store.dismissVoiceNeedsInfo(n.id); submit({ text: n.text, ...extra }) }

async function submit({ text, species, force }) {
  const clean = cleanTranscript(text)
  if (!clean || busy.value) return
  busy.value = true
  const d = new Date()
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` // ora della dettatura, anche se l'invio avviene dopo
  try {
    const res = await store.addVoiceCatch(props.session._id, { text: clean, time, species, force })
    if (res.error === 'localSession') return
    if (res.queued) { toast(t('voice.savedForLater'), { type: 'info' }); return }
    if (res.error) { toast(res.error, { type: 'danger' }); return }
    for (const r of res.results.filter(r => r.status === 'saved')) announce(r)
  } finally { busy.value = false }
}

function announce(r) {
  const c = r.catch
  const lines = [summarizeCatch(c, t('session.ongoing.releasedLower'))]
  if (r.matchedAlias) lines.push(t('voice.alias', { alias: r.matchedAlias }))
  if (c.toComplete) lines.push(t('voice.toComplete'))
  const id = toast(`${t('voice.saved')}: ${lines.join(' · ')}`, {
    type: c.toComplete ? 'warning' : 'success', duration: 8000,
    action: {
      label: t('voice.undo'),
      onClick: async () => { if (await store.undoCatch(props.session._id, c._id)) toast(t('voice.undone'), { type: 'info' }); else toast(t('voice.undoFailed'), { type: 'danger' }) }
    }
  })
  if (c.toComplete) {
    const idx = (store.current?.catches || []).findIndex(x => x._id === c._id)
    if (idx >= 0) toast(t('voice.completeHint'), { type: 'info', duration: 8000, action: { label: t('voice.complete'), onClick: () => { dismiss(id); router.push(`/session/${props.session._id}/catch/${idx}`) } } })
  }
}
</script>

<style scoped>
.voice { display: flex; flex-direction: column; gap: 10px; }
.row { display: flex; gap: 10px; align-items: stretch; }
.mic { flex: 1; min-height: 60px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); color: var(--foam); font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
.mic.on { background: rgb(var(--color-sand-text) / .18); border-color: rgb(var(--color-sand-text)); transform: scale(.98); }
.mic.busy { opacity: .7; }
.kbd { width: 60px; height: auto; }
.interim { margin: 0; font-size: 14px; color: var(--text-muted); font-style: italic; }
.type { display: flex; gap: 8px; }
.type .fl-inp { flex: 1; min-width: 0; }
.notice { background: var(--surface); border: 1px solid rgb(var(--color-sand-text) / .6); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.q { margin: 0; font-weight: 700; }
.heard { margin: 0; font-size: 13px; color: var(--text-muted); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ghost { opacity: .75; }
.queued { margin: 0; display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
</style>
