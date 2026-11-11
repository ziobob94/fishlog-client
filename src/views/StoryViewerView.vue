<template>
  <div class="viewer" @keydown.esc="close" tabindex="-1" ref="root">
    <div v-if="loading" class="center"><div class="m-spinner"></div></div>
    <div v-else-if="!stories.length" class="center">
      <p>{{ t('stories.noStories') }}</p>
      <button type="button" class="fl-btn2 back" @click="close">{{ t('stories.close') }}</button>
    </div>

    <template v-else>
      <div class="bg" :class="{ plain: !current.media }">
        <img v-if="current.media?.type === 'photo'" :src="current.media.url" alt="" />
        <video v-else-if="current.media?.type === 'video'" ref="video" :src="current.media.url" autoplay playsinline @timeupdate="onVideoTime" @ended="next"></video>
        <svg v-else class="iso" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="#7dd3fc" stroke-width="1.5"><path opacity=".2" d="M-40 140C120 60 300 100 420 240" /><path opacity=".14" d="M-60 600C80 420 300 460 440 680" /></g>
        </svg>
      </div>

      <div class="bars" aria-hidden="true">
        <span v-for="(s, i) in stories" :key="s._id" class="bar"><i :style="{ width: (i < index ? 100 : i === index ? progress * 100 : 0) + '%' }"></i></span>
      </div>

      <header class="top">
        <RouterLink :to="profileTo" class="avatar" :aria-label="author?.displayName" @click="paused = true"><img v-if="author?.avatar" :src="author.avatar" alt="" /><template v-else>{{ toInitials(author?.displayName || '?') }}</template></RouterLink>
        <span class="who"><RouterLink :to="profileTo" class="who-name"><strong>{{ author?.displayName }}</strong></RouterLink><small>{{ ago(current.createdAt) }}<template v-if="place"> · {{ place }}</template></small></span>
        <button v-if="isOwn" type="button" class="icon" :aria-label="t('stories.delete')" @click="removeStory"><Trash2 :size="20" /></button>
        <button type="button" class="icon" :aria-label="t('stories.close')" @click="close"><X :size="24" /></button>
      </header>

      <button type="button" class="tap tap-l" :aria-label="'‹'" @click="prev"></button>
      <button type="button" class="tap tap-r" :aria-label="'›'" @click="next"></button>

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

const meId = computed(() => String(auth.user?._id || auth.user?.id))
const isOwn = computed(() => String(route.params.userId) === meId.value)
const current = computed(() => stories.value[index.value])
const place = computed(() => current.value?.stickers?.find(s => s.kind === 'place')?.label || '')

function ago(d) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000))
  if (mins < 1) return t('stories.justNow')
  return mins < 60 ? t('stories.agoMin', { n: mins }) : t('stories.ago', { n: Math.round(mins / 60) })
}

onMounted(async () => {
  try {
    const data = await store.fetchUser(route.params.userId)
    author.value = data.author
    stories.value = data.stories
    // parte dalla prima non vista
    const firstUnseen = stories.value.findIndex(s => !s.seen)
    index.value = firstUnseen > -1 ? firstUnseen : 0
  } catch { stories.value = [] }
  loading.value = false
  root.value?.focus()
  startTimer()
})
onBeforeUnmount(() => clearInterval(timer))

watch(index, () => { progress.value = 0; if (current.value && !current.value.seen) { store.markViewed(current.value._id); current.value.seen = true } }, { immediate: true })

function startTimer() {
  clearInterval(timer)
  timer = setInterval(() => {
    if (paused.value || !current.value) return
    if (current.value.media?.type === 'video') return
    progress.value += 50 / DURATION
    if (progress.value >= 1) next()
  }, 50)
}
function onVideoTime() {
  const v = video.value
  if (v?.duration) progress.value = v.currentTime / v.duration
}
function next() { if (index.value < stories.value.length - 1) index.value++; else close() }
function prev() { if (index.value > 0) index.value--; else progress.value = 0 }
function close() { router.back() }

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
.viewer { position: fixed; inset: 0; z-index: 250; background: #000; color: #fff; outline: none; }
.center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
.back { max-width: 200px; }
.bg { position: absolute; inset: 0; background: radial-gradient(120% 80% at 70% 0%, #1b3a5c, #0b1623); }
.bg img, .bg video { width: 100%; height: 100%; object-fit: cover; display: block; }
.iso { width: 100%; height: 100%; }
.bars { position: absolute; left: 12px; right: 12px; top: calc(10px + env(safe-area-inset-top)); display: flex; gap: 4px; z-index: 3; }
.bar { flex: 1; height: 3px; border-radius: 2px; background: rgba(255,255,255,.3); overflow: hidden; }
.bar i { display: block; height: 100%; background: #fff; }
.top { position: absolute; left: 12px; right: 12px; top: calc(22px + env(safe-area-inset-top)); display: flex; align-items: center; gap: 10px; z-index: 4; }
.avatar { width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgb(var(--color-sand-text)); background: var(--ocean-glow); color: rgb(var(--color-ocean-text)); font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex: none; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.who { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.who-name { color: inherit; text-decoration: none; }
.who strong { font-size: 16px; font-weight: 700; }
.who small { font-size: 13px; opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.icon { width: 44px; height: 44px; background: none; border: 0; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex: none; }
.icon:disabled { opacity: .4; }
.heart.on { color: #f59e0b; }
.tap { position: absolute; top: 90px; bottom: 90px; width: 35%; background: none; border: 0; z-index: 2; cursor: pointer; }
.tap-l { left: 0; }
.tap-r { right: 0; width: 65%; }
.stickers { position: absolute; left: 16px; right: 16px; top: 28%; z-index: 3; display: flex; flex-direction: column; gap: 14px; align-items: flex-start; pointer-events: none; }
.stickers :deep(a) { pointer-events: auto; }
.bottom { position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 12px calc(14px + env(safe-area-inset-bottom)); z-index: 4; }
.reply { display: flex; align-items: center; gap: 4px; }
.reply .fl-inp { flex: 1; border-radius: 26px; background: rgba(11,22,35,.6); color: #fff; border-color: rgba(255,255,255,.5); }
.views { display: flex; align-items: center; gap: 8px; font-size: 13px; margin: 0; }
</style>
