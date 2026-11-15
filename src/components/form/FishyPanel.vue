<template>
  <section class="voice" :aria-label="t('fishy.title')">
    <!-- Annunci per lettori di schermo: «Ti ascolto», «Sto capendo», «Registrata: …» -->
    <p class="sr-only" aria-live="polite" role="status">{{ announcement }}</p>

    <!-- Presentazione: solo finché non c'è uno scambio, una domanda, un avviso o un ascolto in corso (nessuno storico) -->
    <div v-if="showIntro" class="hello">
      <Fishy :size="120" />
      <h3>{{ t('fishy.greeting') }}</h3>
      <p class="hello-p">{{ t('fishy.introShort') }}</p>
      <div class="cards">
        <button v-for="c in cards" :key="c.key" type="button" class="card" @click="useExample(c.text)">
          <span class="ic" aria-hidden="true"><component :is="c.icon" :size="20" /></span>
          <span class="card-t"><span class="card-l">{{ c.label }}</span><span class="card-x">«{{ c.text }}»</span></span>
        </button>
      </div>
    </div>

    <!-- Ultimo scambio (nessuno storico: il comando successivo lo sostituisce) -->
    <div v-if="exchange || listings.length" class="conv">
      <p v-if="exchange" class="said"><span class="said-l">{{ t('fishy.said') }}</span> {{ exchange.text }}</p>

      <TransitionGroup v-if="exchange" name="fishy-pop" tag="div" class="rows">
        <div v-for="row in exchange.rows" :key="row.id" class="act" :class="[row.kind, { amber: stillToComplete(row) && row.state === 'done', gone: row.state !== 'done' }]">
          <span class="ic" aria-hidden="true"><component :is="ICON[row.kind]" :size="20" /></span>
          <div class="body">
            <template v-if="row.state === 'done'">
              <span v-if="degraded" class="badge">{{ t('fishy.state.simplifiedBadge') }}</span>
              <strong>{{ row.title }}</strong>
              <span class="sum">
                <template v-for="(p, i) in row.parts" :key="i"><span :class="{ 'fl-mono': p.mono }">{{ p.text }}</span><i v-if="i < row.parts.length - 1"> · </i></template>
              </span>
              <span v-if="row.alias" class="sub">{{ t('voice.alias', { alias: row.alias }) }}</span>
              <span v-if="degraded && row.kind === 'catch'" class="sub">{{ t('fishy.state.checkSpeciesWeight') }}</span>
              <span v-if="stillToComplete(row)" class="sub tc"><AlertCircle :size="14" /> {{ t('voice.toComplete') }}</span>
              <span class="sub fl-mono">{{ row.time }}</span>
            </template>
            <template v-else-if="row.state === 'undoing'">
              <strong>{{ t('fishy.undone') }}</strong>
              <span class="sub fl-mono">{{ t('fishy.restoreIn', { n: row.left }) }}</span>
            </template>
            <template v-else-if="row.state === 'failed'">
              <strong>{{ row.title }}</strong><span class="sub err"><AlertTriangle :size="14" /> {{ t('voice.undoFailed') }}</span>
            </template>
            <template v-else><strong>{{ t('fishy.undone') }}</strong></template>
          </div>
          <div class="btns">
            <RouterLink v-if="row.state === 'done' && row.completeTo && stillToComplete(row)" :to="row.completeTo" class="btn amberbtn" @click="$emit('close')">{{ t('fishy.completeBtn') }}</RouterLink>
            <button v-if="row.state === 'done' || row.state === 'failed'" type="button" class="btn" @click="conversation.undoRow(row)"><Undo2 :size="16" /> {{ t('voice.undo') }}</button>
            <button v-else-if="row.state === 'undoing'" type="button" class="btn" @click="conversation.restoreRow(row)"><RotateCcw :size="16" /> {{ t('fishy.restore') }}</button>
          </div>
        </div>
      </TransitionGroup>

      <!-- Annunci preparati da Fishy: non sono pubblicati finché non confermi -->
      <div v-for="l in listings" :key="l.id" class="act listing" :class="{ gone: l.state === 'published' }">
        <span class="ic" aria-hidden="true"><Tag :size="20" /></span>
        <div class="body">
          <strong>{{ l.state === 'published' ? t('fishy.listing.published') : t('fishy.listing.draft') }}</strong>
          <span class="sum">
            <template v-for="(p, i) in parts(l.draft)" :key="i"><span>{{ p }}</span><i v-if="i < parts(l.draft).length - 1"> · </i></template>
          </span>
          <span v-if="l.draft.description" class="sub">{{ l.draft.description }}</span>
          <span v-if="l.state !== 'published'" class="sub">{{ t('fishy.listing.visibleAll') }} · {{ t('fishy.listing.notYet') }}</span>
          <span v-if="l.state === 'error'" class="sub err"><AlertTriangle :size="14" /> {{ l.error || t('fishy.listing.failed') }}</span>
        </div>
        <div class="btns">
          <RouterLink v-if="l.state === 'published'" :to="`/market/${l.listingId}`" class="btn amberbtn" @click="$emit('close')">{{ t('fishy.listing.view') }}</RouterLink>
          <template v-else>
            <button type="button" class="btn amberbtn" :disabled="l.state === 'publishing'" @click="store.publishVoiceListing(l)">{{ l.state === 'publishing' ? t('market.form.saving') : t('fishy.listing.publish') }}</button>
            <button type="button" class="btn" :disabled="l.state === 'publishing'" @click="editListing(l)">{{ t('fishy.listing.edit') }}</button>
            <button type="button" class="btn" :disabled="l.state === 'publishing'" @click="store.dismissVoiceListing(l.id)">{{ t('fishy.cancel') }}</button>
          </template>
        </div>
      </div>

      <p v-for="(n, i) in exchange?.notes || []" :key="`n${i}`" class="info"><Info :size="16" /> {{ n }}</p>
    </div>

    <!-- Domande di Fishy: serve un'informazione -->
    <div v-for="n in notices" :key="n.id" class="notice" :class="{ dashed: n.reason === 'not_understood' }" role="alert">
      <div class="nq">
        <Fishy expression="confused" :size="32" avatar />
        <div>
          <p class="q">{{ n.reason === 'not_understood' ? t('fishy.state.notUnderstood') : n.question }}</p>
          <p v-if="n.reason === 'not_understood' && n.question" class="sub">{{ n.question }}</p>
        </div>
      </div>
      <template v-if="n.reason === 'not_understood'">
        <div v-if="n.text" class="heard"><span class="sub">{{ t('fishy.state.heard') }}</span><em>«{{ n.text }}»</em></div>
        <button v-if="supported" type="button" class="pbtn" :disabled="busy" @click="repeatByVoice(n)"><Mic :size="16" /> {{ t('fishy.state.repeatVoice') }}</button>
        <button type="button" class="obtn" :disabled="busy" @click="writeInstead(n)"><Keyboard :size="16" /> {{ t('fishy.state.write') }}</button>
      </template>
      <template v-else>
        <div class="chips">
          <button v-if="n.reason === 'place_missing'" type="button" class="chip pos" :disabled="busy || locating" @click="usePosition(n)"><LocateFixed :size="16" /> {{ locating ? t('fishy.state.locating') : t('fishy.state.useMyPosition') }}</button>
          <template v-if="n.reason === 'place_missing'">
            <button v-for="p in recentPlaces" :key="p" type="button" class="chip" :disabled="busy" @click="answerPlace(n, p)">{{ p }}</button>
          </template>
          <button v-for="c in (n.candidates || [])" :key="c" type="button" class="chip" :disabled="busy" @click="answer(n, { species: c })">{{ c }}</button>
          <button v-if="n.reason === 'species_unknown' && n.asked" type="button" class="chip" :disabled="busy" @click="answer(n, { species: n.asked, force: true })">{{ t('voice.useAnyway', { name: n.asked }) }}</button>
          <button type="button" class="chip ghost" @click="store.dismissVoiceNeedsInfo(n.id)">{{ t('voice.dismiss') }}</button>
        </div>
        <p v-if="n.reason === 'place_missing'" class="sub">{{ locMsg || t('fishy.state.placeHint') }}</p>
      </template>
    </div>

    <!-- Stati: coda, limite, servizio, microfono -->
    <div v-if="queued && issue !== 'ai_down'" class="scard" role="status">
      <p class="st"><Clock :size="18" /> {{ t('fishy.state.pendingTitle', { n: queued }, queued) }}</p>
      <p class="sub">{{ issueText || t('fishy.state.pendingBody') }}</p>
      <ul class="qlist"><li v-for="i in queuedItems" :key="i.localId"><span>«{{ i.data?.text }}»</span><span class="fl-mono">{{ i.data?.time }}</span></li></ul>
    </div>
    <div v-if="issue === 'ai_down'" class="scard bad" role="alert">
      <p class="st"><AlertTriangle :size="18" /> {{ t('fishy.state.aiDownTitle') }}</p>
      <p class="sub">{{ issueText }}</p>
      <button type="button" class="pbtn" :disabled="offline.syncing" @click="offline.sync()"><RefreshCw :size="16" /> {{ t('fishy.state.retryNow') }}</button>
      <button type="button" class="obtn" @click="manualEntry"><Pencil :size="16" /> {{ t('fishy.state.writeByHand') }}</button>
    </div>
    <p v-if="issue && !['degraded', 'error', 'ai_down'].includes(issue) && !(queued && ['rate_limit', 'offline'].includes(issue))" class="state" :class="issue" role="status">
      <component :is="issue === 'mic_denied' ? MicOff : issue === 'offline' ? WifiOff : Clock" :size="16" /> {{ issueText }}
    </p>
    <p v-if="issue === 'error'" class="state err" role="alert"><AlertTriangle :size="16" /> {{ issueText }}</p>
    <p v-if="issue === 'degraded'" class="state warn" role="status"><AlertCircle :size="16" /> {{ t('fishy.state.simplified') }}</p>
    <div v-if="unsynced" class="scard sync" role="status">
      <p class="st"><Loader2 :size="18" class="fishy-spin" /> {{ t('fishy.state.syncingTitle') }}</p>
      <p class="sub">{{ t('fishy.state.unsynced') }}</p>
      <button type="button" class="obtn" @click="manualEntry"><Pencil :size="16" /> {{ t('fishy.state.recordByHand') }}</button>
    </div>
    <p v-if="!supported && issue !== 'mic_denied'" class="state calm"><Keyboard :size="16" /> {{ t('fishy.state.keyboardOnly') }}</p>

    <!-- In ascolto: testo provvisorio e, col tieni-premuto, la zona di annullo -->
    <p v-if="listening && interim" class="interim">{{ interim }}</p>
    <p v-if="holding" class="cancelhint" :class="{ on: inCancel }"><ArrowLeft :size="16" /> {{ inCancel ? t('fishy.releaseToCancel') : t('fishy.slideToCancel') }}</p>

    <div class="row">
      <button
        v-if="supported" type="button" class="mic" :class="{ on: listening, busy }" :disabled="busy"
        :aria-label="listening ? t('fishy.stopAria') : t('fishy.startAria')"
        @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onCancel" @click="onClick" @contextmenu.prevent
      >
        <Loader2 v-if="busy" :size="24" class="fishy-spin" />
        <Square v-else-if="listening" :size="22" fill="currentColor" />
        <Mic v-else :size="24" />
        <span class="lab">{{ label }}</span>
        <span v-if="listening" class="fl-mono tm">{{ elapsedLabel }}</span>
      </button>
      <button type="button" class="kbd" :disabled="busy" :aria-label="t('voice.typeAria')" :aria-pressed="typing" :title="t('voice.typeAria')" @click="typing = !typing"><Keyboard :size="22" /></button>
      <button v-if="listening || closable" type="button" class="cancelbtn" @click="listening ? cancelListening() : $emit('close')">{{ t('fishy.cancel') }}</button>
    </div>

    <p v-if="supported && (listening ? !holding : !hideHold)" class="hint">{{ listening ? t('fishy.autoStopHint') : t('fishy.holdHint') }}</p>

    <form v-if="typing || !supported" class="type" @submit.prevent="sendTyped">
      <input ref="inp" v-model="typed" class="fl-inp" type="text" maxlength="600" :placeholder="t('voice.placeholder')" :aria-label="t('voice.placeholder')" :disabled="busy" />
      <button type="submit" class="fl-btn2" :disabled="busy || !typed.trim()">{{ t('voice.send') }}</button>
    </form>

    <div v-if="!busy && !listening && !showIntro" class="try">
      <span class="try-l">{{ t('fishy.try') }}</span>
      <button v-for="ex in examples" :key="ex" type="button" class="ex" @click="useExample(ex)">«{{ ex }}»</button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Mic, MicOff, Keyboard, Loader2, WifiOff, Square, Play, Fish, RefreshCw, Flag, Undo2, RotateCcw, AlertCircle, AlertTriangle, Info, Clock, ArrowLeft, Tag, Pencil, LocateFixed, MapPin } from 'lucide-vue-next'
import Fishy from '../Fishy.vue'
import { useSessionStore } from '../../stores/sessions.js'
import { useOfflineStore } from '../../stores/offline.js'
import { reverseGeocode } from '../../utils/places.js'
import { useMarketStore } from '../../stores/market.js'
import { listingParts } from '../../utils/fishyListing.js'
import { useFishyVoice } from '../../composables/useFishyVoice.js'
import { isIOS } from '../../composables/useSpeech.js'
import { isCancelZone, EXAMPLES_FULL_UNTIL } from '../../utils/fishyFab.js'

// Fishy, l'assistente vocale. Modo principale: tocca per parlare, tocca per finire (il bottone alterna «Inizia» e
// «Ferma», quindi funziona con VoiceOver e Switch Control). Scorciatoia: tieni premuto e rilascia, con zona di annullo
// a sinistra. Su iPhone il tieni-premuto è disattivato: l'ascolto parte solo da un tocco completo.
defineProps({ closable: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const ICON = { start: Play, catch: Fish, bait: RefreshCw, update: RefreshCw, end: Flag }
const { t } = useI18n()
const router = useRouter()
const market = useMarketStore()
const store = useSessionStore()
// «Da completare» è uno snapshot della risposta di Fishy: va riletto dalla cattura corrente,
// così sparisce appena peso o misura vengono salvati dal form.
function stillToComplete(row) {
  if (!row.toComplete) return false
  const id = row.result?.catch?._id
  if (!id) return true
  for (const s of [store.current, store.ongoing]) {
    if (s?._id !== row.sessionId) continue
    const c = (s.catches || []).find(x => x._id === id)
    if (c) return !(Number(c.weightKg) > 0 || Number(c.lengthCm) > 0)
  }
  return true
}
const offline = useOfflineStore()
const voice = useFishyVoice()
const { conversation, noMic, busy, issue, issueText, announcement, queued, listening, supported, interim, elapsedLabel, startListening, finish, cancelListening, submit } = voice

const degraded = computed(() => issue.value === 'degraded')
const queuedItems = computed(() => offline.outbox.filter(i => i.meta?.kind === 'assistant' || i.meta?.kind === 'voice-catch'))
const cards = computed(() => [
  { key: 'start', icon: MapPin, label: t('fishy.cards.start'), text: t('fishy.ex1') },
  { key: 'catch', icon: Fish, label: t('fishy.cards.catch'), text: t('fishy.ex2') },
  { key: 'bait', icon: RefreshCw, label: t('fishy.cards.bait'), text: t('fishy.ex3') }
])
// Luoghi recenti: i più usati nelle uscite già caricate, al massimo tre.
const recentPlaces = computed(() => {
  const seen = []
  for (const s of store.sessions || []) {
    const name = s.location?.name
    if (name && !seen.includes(name)) seen.push(name)
    if (seen.length === 3) break
  }
  return seen
})
const locating = ref(false)
const locMsg = ref('')
// Tieni-premuto: su iPhone è disattivato (solo tocco), quindi lì la frase non va mostrata.
const hideHold = computed(() => isIOS())

const typing = ref(false)
const typed = ref('')
const inp = ref(null)
// Senza microfono (assente o negato) si scrive: il campo si apre da solo e prende il focus.
watch(noMic, async n => { if (n) { typing.value = true; await nextTick(); inp.value?.focus() } }, { immediate: true })
const exchange = computed(() => conversation.last.value)
const notices = computed(() => store.voiceNeedsInfo)
const listings = computed(() => store.voiceListings)
const showIntro = computed(() => !exchange.value && !listings.value.length && !notices.value.length && !issue.value && !queued.value && !busy.value && !listening.value)
const unsynced = computed(() => String(store.ongoing?._id || '').startsWith('local-'))
const label = computed(() => busy.value ? t('voice.thinking') : listening.value ? t('fishy.tapToFinish') : t('fishy.tapToTalk'))
const EX = ['ex1', 'ex2', 'ex3', 'ex4']
const examples = computed(() => (voice.uses.value < EXAMPLES_FULL_UNTIL ? EX : EX.slice(0, 2)).map(k => t(`fishy.${k}`)))

// ── Tieni premuto (scorciatoia) ──
const HOLD_MS = 450
const holding = ref(false)
const inCancel = ref(false)
let downAt = 0, startX = 0, suppressClick = false
function onDown(e) {
  suppressClick = false
  if (busy.value || listening.value) return
  if (e.pointerType !== 'mouse' && isIOS()) return // iPhone: solo tocco
  e.currentTarget.setPointerCapture?.(e.pointerId)
  downAt = Date.now(); startX = e.clientX; suppressClick = true
  startListening()
  holding.value = listening.value
}
function onMove(e) { if (holding.value) inCancel.value = isCancelZone(startX, e.clientX) }
function onUp(e) {
  if (!holding.value) return
  const wasCancel = inCancel.value
  holding.value = false; inCancel.value = false
  if (Date.now() - downAt < HOLD_MS) return // tocco breve: resta in ascolto (modo «tocca per finire»)
  if (wasCancel || isCancelZone(startX, e.clientX)) cancelListening(); else finish()
}
// Il browser ha annullato il gesto (scroll, permesso del microfono): non si perde nulla, si passa al modo «tocca».
function onCancel() { holding.value = false; inCancel.value = false }
function onClick() {
  if (suppressClick) { suppressClick = false; return }
  if (busy.value) return
  if (listening.value) finish(); else startListening()
}

const parts = d => listingParts(d, { category: t(`market.categories.${d.category || 'altro'}`), condition: t(`market.condition.${d.condition}`) })
// «Modifica»: apre il form del Market già compilato con la bozza; l'annuncio nasce solo se lo pubblichi da lì.
function editListing(l) { market.draft = l.draft; store.dismissVoiceListing(l.id); emit('close'); router.push('/market/new') }
function sendTyped() { const text = typed.value; typed.value = ''; submit({ text }) }
function answer(n, extra) { store.dismissVoiceNeedsInfo(n.id); submit({ text: n.text, ...extra }) }
function answerPlace(n, place) { store.dismissVoiceNeedsInfo(n.id); submit({ text: `${n.text}, a ${place}` }) }
function usePosition(n) {
  if (!navigator.geolocation) { locMsg.value = t('placeInput.noGps'); return }
  locating.value = true; locMsg.value = ''
  navigator.geolocation.getCurrentPosition(async pos => {
    const p = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
    locating.value = false
    if (p?.name) answerPlace(n, p.name); else locMsg.value = t('placeInput.noResults')
  }, () => { locating.value = false; locMsg.value = t('placeInput.gpsDenied') }, { timeout: 10000, enableHighAccuracy: true })
}
function repeatByVoice(n) { store.dismissVoiceNeedsInfo(n.id); startListening() }
async function writeInstead(n) { store.dismissVoiceNeedsInfo(n.id); typing.value = true; await nextTick(); inp.value?.focus() }
// Inserimento a mano: cattura sull'uscita in corso, altrimenti nuova uscita.
function manualEntry() { const id = store.ongoing?._id; emit('close'); router.push(id ? `/session/${id}/catch/new` : '/new') }
async function useExample(ex) { typing.value = true; typed.value = ex; await nextTick(); inp.value?.focus() }
</script>

<style scoped>
.voice { display: flex; flex-direction: column; gap: 10px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.conv { display: flex; flex-direction: column; gap: 8px; }
.said { background: rgb(var(--color-ocean) / .14); border-radius: 24px 24px 8px 24px; padding: 10px 14px; align-self: flex-end; max-width: 92%; font-size: 15px; }
.said-l { color: var(--text-muted); font-size: 13px; }
.rows { display: flex; flex-direction: column; gap: 8px; }
.act { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 10px 10px 10px 12px; }
.act.amber { border-color: rgb(var(--color-sand-text)); border-width: 2px; }
.act.gone { opacity: .8; border-style: dashed; }
.ic { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex: none; background: rgb(var(--color-ocean) / .18); color: rgb(var(--color-ocean-text)); }
.amber .ic { background: rgb(var(--color-sand-text) / .2); color: rgb(var(--color-sand-text)); }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.body strong { font-size: 14px; }
.sum { font-size: 15px; font-weight: 700; overflow-wrap: anywhere; }
.sum i { font-style: normal; color: var(--text-muted); }
.sub { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.sub.tc { color: rgb(var(--color-sand-text)); font-weight: 700; } .sub.err { color: rgb(var(--color-danger-text, var(--color-danger))); }
.btns { display: flex; flex-direction: column; gap: 6px; flex: none; }
.btn { min-height: 44px; min-width: 44px; padding: 0 12px; border-radius: 14px; border: 1px solid var(--border); background: transparent; color: var(--foam); font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; text-decoration: none; }
.amberbtn { border-color: rgb(var(--color-sand-text)); color: rgb(var(--color-sand-text)); }
.act.listing { align-items: flex-start; border-color: rgb(var(--color-ocean)); }
.info { display: flex; gap: 6px; align-items: flex-start; font-size: 13px; color: var(--text-muted); }
.notice { background: var(--surface); border: 1px solid rgb(var(--color-sand-text) / .6); border-radius: 20px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.nq { display: flex; gap: 10px; align-items: flex-start; }
.q { font-weight: 700; font-size: 15px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { min-height: 44px; padding: 0 16px; border-radius: 22px; border: 1px solid rgb(var(--color-ocean)); background: rgb(var(--color-ocean) / .12); color: var(--foam); font-weight: 700; cursor: pointer; }
.chip.ghost { border-color: var(--border); background: transparent; color: var(--text-muted); }
.state { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 8px 12px; }
.state.err { border-color: rgb(var(--color-danger)); } .state.warn, .state.rate_limit, .state.ai_down { border-color: rgb(var(--color-sand-text)); }
.state.calm { background: transparent; border-style: dashed; }
.cnt { margin-left: auto; font-weight: 700; color: var(--foam); }
.interim { font-size: 14px; color: var(--text-muted); font-style: italic; }
.cancelhint { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 12px; padding: 8px 12px; }
.cancelhint.on { border-color: rgb(var(--color-danger)); color: var(--foam); border-style: solid; }
.row { display: flex; gap: 10px; align-items: stretch; }
.mic { flex: 1; min-height: 60px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); color: var(--foam); font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; cursor: pointer; transition: background-color var(--motion-base) var(--ease-enter), border-color var(--motion-base) var(--ease-enter); }
.mic.on { background: rgb(var(--color-sand-text) / .18); border-color: rgb(var(--color-sand-text)); }
.mic.busy { opacity: .7; }
.tm { font-size: 15px; }
.kbd { width: 60px; min-height: 60px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); color: var(--foam); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.kbd[aria-pressed='true'] { border-color: rgb(var(--color-ocean)); }
.cancelbtn { min-height: 60px; min-width: 44px; padding: 0 12px; border-radius: 20px; border: 1px solid var(--border); background: transparent; color: var(--foam); font-weight: 700; font-size: 14px; cursor: pointer; }
.type { display: flex; gap: 8px; }
.type .fl-inp { flex: 1 1 0; min-width: 0; width: auto; }
.type .fl-btn2 { flex: none; width: auto; padding: 0 20px; }
.hello { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding-top: 8px; }
.hello h3 { margin: 4px 0 0; font-size: 22px; font-weight: 800; color: var(--foam); }
.hello-p { margin: 0 0 6px; font-size: 15px; line-height: 1.4; color: var(--text-muted); max-width: 320px; }
.cards { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.card { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 10px 12px; border-radius: 16px; border: 1px solid var(--border); background: var(--surface); color: var(--foam); text-align: left; cursor: pointer; }
.card-t { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.card-l { font-size: 12px; color: var(--text-muted); }
.card-x { font-size: 15px; font-weight: 700; overflow-wrap: anywhere; }
.hint { margin: 0; text-align: center; font-size: 12px; color: var(--text-muted); }
.badge { align-self: flex-start; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; border: 1px solid rgb(var(--color-sand-text)); color: rgb(var(--color-sand-text)); }
.notice.dashed { border-style: dashed; border-color: var(--border); }
.heard { display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
.chip.pos { border-color: rgb(var(--color-ocean)); color: rgb(var(--color-ocean-text)); display: inline-flex; align-items: center; gap: 6px; }
.pbtn, .obtn { min-height: 44px; padding: 0 14px; border-radius: 14px; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; width: 100%; }
.pbtn { background: rgb(var(--color-ocean)); border: 0; color: #fff; }
.obtn { background: transparent; border: 1px solid var(--border); color: var(--foam); }
.scard { background: var(--surface); border: 1px solid rgb(var(--color-sand-text) / .6); border-radius: 20px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.scard.bad { border-color: rgb(var(--color-danger)); }
.scard.sync { border-color: rgb(var(--color-ocean)); }
.st { margin: 0; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 15px; }
.qlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; font-size: 13px; }
.qlist li { display: flex; justify-content: space-between; gap: 8px; padding: 8px 0; border-top: 1px solid var(--border); }
/* Esempi: lista compatta, allineata a sinistra, righe da 36 px */
.try { display: flex; flex-direction: column; align-items: flex-start; gap: 0; }
.try-l { font-size: 12px; color: var(--text-muted); }
.ex { min-height: 36px; padding: 0; border: 0; background: none; color: rgb(var(--color-ocean-text)); font-size: 13px; line-height: 1.3; text-align: left; cursor: pointer; }
</style>
