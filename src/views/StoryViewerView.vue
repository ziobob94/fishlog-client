<template>
  <div class="viewer" :class="[enterClass, { dragging: dragMode }]" :style="dragStyle" @keydown.esc="close" @keydown.left="prev" @keydown.right="next" tabindex="-1" ref="root"
    @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onCancel" @contextmenu.prevent>
    <div v-if="loading" class="center"><div class="m-spinner"></div></div>
    <div v-else-if="!stories.length" class="center">
      <p>{{ t('stories.noStories') }}</p>
      <button type="button" class="fl-btn2 back" @click="close">{{ t('stories.close') }}</button>
    </div>

    <template v-else>
      <div class="bg" :class="{ plain: !current.media }">
        <template v-if="current.media?.type === 'photo'">
          <img class="blur" :src="current.media.url" alt="" aria-hidden="true" />
          <img class="main" :src="current.media.url" alt="" />
        </template>
        <video v-else-if="current.media?.type === 'video'" ref="video" :key="current._id" :src="current.media.url" autoplay playsinline @timeupdate="onVideoTime" @ended="next"></video>
        <svg v-else class="iso" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="#7dd3fc" stroke-width="1.5"><path opacity=".2" d="M-40 140C120 60 300 100 420 240" /><path opacity=".14" d="M-60 600C80 420 300 460 440 680" /></g>
        </svg>
      </div>

      <div class="bars" aria-hidden="true">
        <span v-for="(s, i) in stories" :key="s._id" class="bar"><i :style="{ transform: `scaleX(${i < index ? 1 : i === index ? progress : 0})` }"></i></span>
      </div>

      <header class="top">
        <RouterLink :to="profileTo" class="avatar" :aria-label="author?.displayName" @click="paused = true"><img v-if="author?.avatar" :src="author.avatar" alt="" /><template v-else>{{ toInitials(author?.displayName || '?') }}</template></RouterLink>
        <span class="who"><RouterLink :to="profileTo" class="who-name"><strong>{{ author?.displayName }}</strong></RouterLink><small>{{ ago(current.createdAt) }}<template v-if="place"> · {{ place }}</template></small></span>
        <button v-if="isOwn" type="button" class="icon" :aria-label="t('stories.delete')" @click="removeStory"><Trash2 :size="20" /></button>
        <button type="button" class="icon" :aria-label="t('stories.close')" @click="close"><X :size="24" /></button>
      </header>

      <button type="button" class="tap tap-l" :aria-label="'‹'" @click="e => e.detail === 0 && prev()"></button>
      <button type="button" class="tap tap-r" :aria-label="'›'" @click="e => e.detail === 0 && next()"></button>

      <div class="stickers">
        <StorySticker v-for="s in current.stickers" :key="s._id" :sticker="s" :to="s.session ? `/session/${s.session}` : null" />
      </div>

      <footer class="bottom">
        <p v-if="isOwn" class="fl-mono views"><Eye :size="16" /> {{ t('stories.views', { n: current.viewCount || 0 }) }}</p>
        <form v-else class="reply" @submit.prevent="sendReply">
          <input v-model="reply" type="text" class="fl-inp" :placeholder="t('stories.reply', { name: author?.displayName || '' })" @focus="paused = true" @blur="paused = false" />
          <button type="button" class="icon heart" :class="{ on: current.liked }" :aria-label="t('stories.like')" :aria-pressed="current.liked" @click="like"><Heart :size="24" :fill="current.liked ? 'currentColor' : 'none'" /></button>
          <button type="submit" class="icon" :aria-label="t('stories.sendReply')" :disabled="!reply.trim()"><Send :size="22" /></button>
        </form>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { confirmDialog } from '../composables/useConfirm.js'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, Heart, Send, Trash2, Eye } from 'lucide-vue-next'
import api from '../utils/api.js'
import StorySticker from '../components/StorySticker.vue'
import { useAuthStore } from '../stores/auth.js'
import { useStoryStore } from '../stores/stories.js'
import { useToast } from '../composables/useToast.js'
import { toInitials } from '../utils/initials.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useStoryStore()
const { toast } = useToast()

const DURATION = 5000
const HOLD_MS = 220      // tenere premuto oltre questo tempo = pausa
const SLOP = 10          // sotto questa distanza (px) è un tap, non un gesto
const CLOSE_DIST = 110   // swipe giù: distanza minima per chiudere
const USER_DIST = 70     // swipe laterale: distanza minima per cambiare utente
const loading = ref(true)
const author = ref(null)
const profileTo = computed(() => isOwn.value ? '/board' : `/users/${author.value?._id || ''}`)
const stories = ref([])
const index = ref(0)
const progress = ref(0)
const paused = ref(false)
const reply = ref('')
const video = ref(null)
const root = ref(null)
let timer = null
const enterClass = ref('')
let startAtEnd = false
let loadToken = 0

const meId = computed(() => String(auth.user?._id || auth.user?.id))
const isOwn = computed(() => String(route.params.userId) === meId.value)
const current = computed(() => stories.value[index.value])
const place = computed(() => current.value?.stickers?.find(s => s.kind === 'place')?.label || '')

function ago(d) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000))
  if (mins < 1) return t('stories.justNow')
  return mins < 60 ? t('stories.agoMin', { n: mins }) : t('stories.ago', { n: Math.round(mins / 60) })
}

async function load(userId) {
  const token = ++loadToken
  loading.value = true
  progress.value = 0
  index.value = 0
  try {
    const data = await store.fetchUser(userId)
    if (token !== loadToken) return
    author.value = data.author
    stories.value = data.stories
    const firstUnseen = stories.value.findIndex(s => !s.seen)
    index.value = startAtEnd ? stories.value.length - 1 : (firstUnseen > -1 ? firstUnseen : 0)
  } catch { if (token === loadToken) stories.value = [] }
  if (token !== loadToken) return
  startAtEnd = false
  loading.value = false
  root.value?.focus()
}

onMounted(async () => {
  if (!store.groups.length) store.fetchRail()
  document.addEventListener('visibilitychange', onVisibility)
  startTimer()
})
watch(() => route.params.userId, id => { if (id) load(id) }, { immediate: true })
function onVisibility() { hidden = document.hidden }
let hidden = false
onBeforeUnmount(() => { clearInterval(timer); clearTimeout(holdTimer); document.removeEventListener('visibilitychange', onVisibility) })

// Osserva la storia corrente (non solo l'indice): al primo caricamento l'indice
// può restare 0 e un watch sull'indice non scatterebbe, quindi la prima storia
// non verrebbe mai segnata come vista.
watch(() => current.value?._id, () => {
  progress.value = 0
  if (current.value && !current.value.seen) { store.markViewed(current.value._id); current.value.seen = true }
}, { immediate: true })

function startTimer() {
  clearInterval(timer)
  timer = setInterval(() => {
    if (paused.value || hidden || !current.value) return
    if (current.value.media?.type === 'video') return
    progress.value += 50 / DURATION
    if (progress.value >= 1) next()
  }, 50)
}
function onVideoTime() {
  const v = video.value
  if (v?.duration) progress.value = v.currentTime / v.duration
}
// Sequenza degli utenti come nella fila: la tua storia, poi le altre.
const order = computed(() => {
  const gs = store.groups
  return [...gs.filter(g => g.own), ...gs.filter(g => !g.own)].map(g => String(g.author._id))
})
function neighbour(step) {
  const i = order.value.indexOf(String(route.params.userId))
  return i < 0 ? null : order.value[i + step] || null
}
function goUser(step) {
  const id = neighbour(step)
  if (!id) return false
  enterClass.value = step > 0 ? 'enter-next' : 'enter-prev'
  startAtEnd = step < 0
  router.replace(`/stories/${id}`)
  return true
}
function next() {
  if (index.value < stories.value.length - 1) index.value++
  else if (!goUser(1)) close()
}
function prev() {
  if (index.value > 0) index.value--
  else if (progress.value > 0.05 || !goUser(-1)) progress.value = 0
}
function close() { router.back() }

// ── Gesti: tap ai lati, tieni premuto per fermare, swipe laterale = utente, swipe giù = chiudi ──
const dragMode = ref(null)   // 'x' | 'y' | null
const dragX = ref(0)
const dragY = ref(0)
const dragStyle = computed(() => {
  if (dragMode.value === 'y') {
    const k = Math.min(1, Math.max(0, dragY.value) / 400)
    return { transform: `translateY(${Math.max(0, dragY.value)}px) scale(${1 - (1 - 0.94) * k})`, borderRadius: `${k * 24}px` }
  }
  if (dragMode.value === 'x') return { transform: `translateX(${dragX.value * 0.5}px)` }
  return null
})
let g = null
let holdTimer = null
let holding = false

function pauseHold(on) {
  holding = on
  paused.value = on
  const v = video.value
  if (v) on ? v.pause() : v.play?.().catch(() => {})
}
function onDown(e) {
  if (e.button > 0 || !e.isPrimary || loading.value || !stories.value.length) return
  if (e.target.closest('.top, .bottom, .stickers a')) return
  g = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }
  clearTimeout(holdTimer)
  holdTimer = setTimeout(() => pauseHold(true), HOLD_MS)
}
function onMove(e) {
  if (!g || e.pointerId !== g.id) return
  const dx = e.clientX - g.x, dy = e.clientY - g.y
  if (!dragMode.value) {
    if (Math.hypot(dx, dy) < SLOP) return
    clearTimeout(holdTimer)
    dragMode.value = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
    if (dragMode.value === 'y' && dy < 0) { dragMode.value = null; g = null; if (holding) pauseHold(false); return }
    root.value?.setPointerCapture?.(e.pointerId)
    paused.value = true
  }
  dragX.value = dx; dragY.value = dy
}
function endGesture() { clearTimeout(holdTimer); g = null; dragMode.value = null; dragX.value = 0; dragY.value = 0 }
function onUp(e) {
  if (!g || e.pointerId !== g.id) return
  const dx = e.clientX - g.x, dy = e.clientY - g.y
  const mode = dragMode.value, wasHolding = holding
  const tap = !mode && !wasHolding
  const w = window.innerWidth
  endGesture()
  if (mode === 'y' && dy > CLOSE_DIST) { close(); return }
  if (mode === 'x' && Math.abs(dx) > USER_DIST) {
    paused.value = false
    if (!goUser(dx < 0 ? 1 : -1)) { /* nessun altro utente: resta qui */ }
    return
  }
  pauseHold(false)
  if (tap) (e.clientX < w * 0.35 ? prev : next)()
}
function onCancel() { endGesture(); pauseHold(false) }

async function like() {
  current.value.liked = await store.toggleLike(current.value._id)
}

async function sendReply() {
  const text = reply.value.trim()
  if (!text) return
  try {
    const { data: conv } = await api.get(`/chat/with/${route.params.userId}`)
    await api.post(`/chat/${conv._id}/messages`, { body: `↩ ${t('stories.replyPrefix')}: ${text}` })
    reply.value = ''
    toast(t('stories.replySent'), { type: 'success' })
  } catch (e) {
    toast(e.response?.data?.error || e.message, { type: 'error' })
  }
}

async function removeStory() {
  if (!(await confirmDialog(t('stories.deleteConfirm')))) return
  await store.remove(current.value._id)
  stories.value.splice(index.value, 1)
  if (!stories.value.length) close(); else if (index.value >= stories.value.length) index.value = stories.value.length - 1
}
</script>

<style scoped>
.viewer { position: fixed; inset: 0; z-index: 250; background: #000; color: #fff; outline: none; overflow: hidden;
  touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  transition: transform var(--motion-base) var(--ease-spring); }
.viewer.dragging { transition: none; }
.viewer.enter-next { animation: story-in-next var(--motion-slow) var(--ease-enter); }
.viewer.enter-prev { animation: story-in-prev var(--motion-slow) var(--ease-enter); }
@keyframes story-in-next { from { opacity: 0; transform: translateX(var(--dist-lg)); } }
@keyframes story-in-prev { from { opacity: 0; transform: translateX(calc(var(--dist-lg) * -1)); } }
.reply .fl-inp { -webkit-user-select: text; user-select: text; }
.center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
.back { max-width: 200px; }
.bg { position: absolute; inset: 0; background: radial-gradient(120% 80% at 70% 0%, #1b3a5c, #0b1623); }
.bg img, .bg video { width: 100%; height: 100%; object-fit: cover; display: block; }
/* foto: intera (contain) su sfondo sfocato, così non viene tagliata */
.bg img { position: absolute; inset: 0; }
.bg img.blur { filter: blur(28px) brightness(.7); transform: scale(1.15); }
.bg img.main { object-fit: contain; }
/* scrim sopra/sotto: i controlli restano leggibili su qualsiasi sfondo */
.bg::after { content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to bottom, rgba(0,0,0,.6) 0, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,.72) 100%); }
.iso { width: 100%; height: 100%; }
.bars { position: absolute; left: 12px; right: 12px; top: calc(10px + env(safe-area-inset-top)); display: flex; gap: 4px; z-index: 3; }
.bar { flex: 1; height: 3px; border-radius: 2px; background: rgba(255,255,255,.3); overflow: hidden; }
.bar i { display: block; height: 100%; background: #fff; transform-origin: left; will-change: transform; }
.top { position: absolute; left: 12px; right: 12px; top: calc(22px + env(safe-area-inset-top)); display: flex; align-items: center; gap: 10px; z-index: 4; }
.avatar { width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgb(var(--color-sand-text)); background: var(--ocean-glow); color: rgb(var(--color-ocean-text)); font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex: none; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.who { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.who-name { color: inherit; text-decoration: none; }
.who { text-shadow: 0 1px 3px rgba(0,0,0,.7); }
.who strong { font-size: 16px; font-weight: 700; }
.who small { font-size: 13px; opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.icon { width: 44px; height: 44px; background: none; border: 0; color: #fff; filter: drop-shadow(0 1px 3px rgba(0,0,0,.7)); display: flex; align-items: center; justify-content: center; cursor: pointer; flex: none; }
.icon:disabled { opacity: .4; }
.heart.on { color: #f59e0b; }
.avatar { box-shadow: 0 0 0 2px rgba(0,0,0,.45); }
.tap { position: absolute; top: 90px; bottom: 90px; width: 35%; background: none; border: 0; z-index: 2; cursor: pointer; }
.tap-l { left: 0; }
.tap-r { right: 0; width: 65%; }
.stickers { position: absolute; left: 16px; right: 16px; top: 28%; z-index: 3; display: flex; flex-direction: column; gap: 14px; align-items: flex-start; pointer-events: none; }
.stickers :deep(a) { pointer-events: auto; }
.bottom { position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 12px calc(14px + env(safe-area-inset-bottom)); z-index: 4; }
.reply { display: flex; align-items: center; gap: 4px; }
.reply .fl-inp { flex: 1; border-radius: 26px; background: rgba(11,22,35,.88); color: #fff; border-color: rgba(255,255,255,.85); }
.reply .fl-inp::placeholder { color: rgba(255,255,255,.85); opacity: 1; }
.views { display: flex; align-items: center; gap: 8px; font-size: 13px; margin: 0; }
</style>
