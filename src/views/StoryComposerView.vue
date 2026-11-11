<template>
  <div class="composer">
    <div class="bg" :style="previewUrl ? { backgroundImage: `url(${previewUrl})` } : null">
      <video v-if="isVideo" :src="previewUrl" class="bg-video" autoplay muted loop playsinline></video>
      <svg v-if="!previewUrl" class="iso" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke="#7dd3fc" stroke-width="1.5">
          <path opacity=".18" d="M-40 120C120 40 300 80 420 220" /><path opacity=".14" d="M-60 560C80 380 300 420 440 640" /><path opacity=".1" d="M-20 700C150 560 280 640 430 780" />
        </g>
      </svg>
    </div>

    <button type="button" class="round close" :aria-label="t('stories.close')" @click="router.back()"><X :size="22" /></button>

    <div class="tools">
      <label class="round" :aria-label="t('stories.chooseMedia')" :title="t('stories.chooseMedia')">
        <Camera :size="22" />
        <input type="file" accept="image/*,video/*" class="sr-only" @change="pickFile" />
      </label>
      <button type="button" class="round" :class="{ on: catchOn }" :aria-pressed="catchOn" :aria-label="t('stories.stickerCatch')" :disabled="!hasCatches" @click="toggleCatch"><Fish :size="22" /></button>
      <button type="button" class="round" :class="{ on: placeOn }" :aria-pressed="placeOn" :aria-label="t('stories.stickerPlace')" :disabled="!session" @click="placeOn = !placeOn"><MapPin :size="22" /></button>
      <button type="button" class="round" :class="{ on: waterOn }" :aria-pressed="waterOn" :aria-label="t('stories.stickerWater')" :disabled="!hasWater" @click="waterOn = !waterOn"><Waves :size="22" /></button>
    </div>

    <div class="stickers">
      <StorySticker v-for="s in previewStickers" :key="s.kind" :sticker="s" />
      <p v-if="!previewUrl && !previewStickers.length" class="hint-empty">{{ session ? t('stories.empty') : t('stories.noSession') }}</p>
    </div>

    <div v-if="catchPicker" class="picker" role="dialog" :aria-label="t('stories.pickCatch')">
      <strong>{{ t('stories.pickCatch') }}</strong>
      <button v-for="c in session.catches" :key="c._id" type="button" class="pick" @click="chooseCatch(c._id)">{{ c.species }}<span v-if="c.lengthCm" class="fl-mono"> · {{ c.lengthCm }} cm</span></button>
    </div>

    <div class="panel">
      <span class="fl-lab">{{ t('stories.whoSees') }}</span>
      <div class="seg">
        <button type="button" :class="{ on: audience === 'all' }" @click="audience = 'all'">{{ t('stories.everyone') }}</button>
        <button type="button" :class="{ on: audience === 'friends' }" @click="audience = 'friends'">{{ t('stories.friendsOnly') }}</button>
      </div>
      <p class="fl-hint">{{ t('stories.ttlHint') }}</p>
      <p v-if="store.error" class="err" role="alert">{{ store.error }}</p>
      <button type="button" class="fl-btn1" :disabled="publishing || !canPublish" @click="publish">
        <span v-if="publishing" class="spinner" style="width:15px;height:15px"></span>
        {{ publishing ? t('stories.publishing') : t('stories.publish') }}
      </button>
      <button type="button" class="redo" @click="reset">{{ t('stories.redo') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, Camera, Fish, MapPin, Waves } from 'lucide-vue-next'
import api from '../utils/api.js'
import StorySticker from '../components/StorySticker.vue'
import { useStoryStore } from '../stores/stories.js'
import { useToast } from '../composables/useToast.js'

const { t } = useI18n()
const router = useRouter()
const store = useStoryStore()
const { toast } = useToast()

const session = ref(null)
const file = ref(null)
const previewUrl = ref('')
const isVideo = computed(() => file.value?.type?.startsWith('video/'))
const audience = ref('friends')
const publishing = ref(false)
const catchOn = ref(false), catchId = ref(null), catchPicker = ref(false)
const placeOn = ref(false), waterOn = ref(false)

const hasCatches = computed(() => !!session.value?.catches?.length)
const hasWater = computed(() => {
  const s = session.value
  return !!s && (Object.values(s.sea || {}).some(v => v && typeof v !== 'object') || Object.values(s.weather || {}).some(v => v && typeof v !== 'object'))
})

const fmtCoords = c => (c?.lat != null && c?.lng != null) ? `${Number(c.lat).toFixed(2)}°N · ${Number(c.lng).toFixed(2)}°E` : ''
const previewStickers = computed(() => {
  const s = session.value, out = []
  if (!s) return out
  if (catchOn.value) {
    const c = s.catches.find(x => x._id === catchId.value)
    if (c) out.push({ kind: 'catch', label: [c.species, c.lengthCm ? `${c.lengthCm} cm` : (c.weightKg ? `${c.weightKg} kg` : '')].filter(Boolean).join(' · '), subtitle: fmtCoords(s.location?.coords) })
  }
  if (placeOn.value) out.push({ kind: 'place', label: s.location?.name || s.title, subtitle: fmtCoords(s.location?.coords) })
  if (waterOn.value) {
    const sea = s.sea || {}, w = s.weather || {}
    out.push({ kind: 'water', label: [sea.waterTemp != null && `${sea.waterTemp}°`, w.windSpeed != null && `${w.windSpeed} km/h`, w.tempAir != null && `aria ${w.tempAir}°C`].filter(Boolean).join(' · ') || t('stories.stickerWater') })
  }
  return out
})
const canPublish = computed(() => !!file.value || previewStickers.value.length > 0)

onMounted(async () => {
  try {
    const { data: list } = await api.get('/sessions', { params: { mine: 'true', limit: 1 } })
    const first = (list.data || list)[0]
    if (first) { const { data } = await api.get(`/sessions/${first._id}`); session.value = data }
  } catch { session.value = null }
})
onBeforeUnmount(() => { if (previewUrl.value) URL.revokeObjectURL(previewUrl.value) })

function pickFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = f
  previewUrl.value = URL.createObjectURL(f)
}

function toggleCatch() {
  if (catchOn.value) { catchOn.value = false; return }
  if (session.value.catches.length === 1) { chooseCatch(session.value.catches[0]._id) } else { catchPicker.value = true }
}
function chooseCatch(id) { catchId.value = id; catchOn.value = true; catchPicker.value = false }

function reset() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = null; previewUrl.value = ''; catchOn.value = false; catchId.value = null; placeOn.value = false; waterOn.value = false; catchPicker.value = false
}

async function publish() {
  if (!canPublish.value) return
  publishing.value = true
  const stickers = []
  const sid = session.value?._id
  if (catchOn.value) stickers.push({ kind: 'catch', sessionId: sid, catchId: catchId.value })
  if (placeOn.value) stickers.push({ kind: 'place', sessionId: sid })
  if (waterOn.value) stickers.push({ kind: 'water', sessionId: sid })
  const created = await store.create({ audience: audience.value, stickers, file: file.value })
  publishing.value = false
  if (created) { toast(t('stories.published'), { type: 'success' }); router.replace('/feed') }
}
</script>

<style scoped>
.composer { position: fixed; inset: 0; z-index: 250; background: #0b1623; color: #fff; overflow: hidden; }
.bg { position: absolute; inset: 0; background: radial-gradient(120% 80% at 70% 0%, #1b3a5c, #0b1623); background-size: cover; background-position: center; }
.bg-video { width: 100%; height: 100%; object-fit: cover; }
.iso { position: absolute; inset: 0; width: 100%; height: 100%; }
.round { width: 48px; height: 48px; border-radius: 50%; background: rgba(11,22,35,.7); border: 1px solid rgba(255,255,255,.25); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; position: relative; backdrop-filter: blur(6px); }
.round.on { background: var(--ocean); border-color: var(--ocean); color: rgb(var(--color-on-primary)); }
.round:disabled { opacity: .4; }
.close { position: absolute; left: 16px; top: calc(16px + env(safe-area-inset-top)); }
.tools { position: absolute; right: 16px; top: calc(16px + env(safe-area-inset-top)); display: flex; flex-direction: column; gap: 12px; }
.stickers { position: absolute; left: 16px; right: 72px; top: 28%; display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
.hint-empty { color: var(--text-muted); font-size: 14px; max-width: 24ch; }
.picker { position: absolute; left: 16px; right: 16px; top: 22%; z-index: 5; background: var(--surface); border: 1px solid var(--border-light); border-radius: 20px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.pick { min-height: 48px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); color: var(--foam); font-weight: 700; text-align: left; padding: 0 14px; cursor: pointer; }
.panel { position: absolute; left: 0; right: 0; bottom: 0; background: var(--surface); border-top: 1px solid var(--border); border-radius: 24px 24px 0 0; padding: 16px 16px calc(16px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 10px; }
.seg { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.seg button { min-height: 48px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface-2); color: var(--foam); font-weight: 700; cursor: pointer; }
.seg button.on { background: var(--ocean); border-color: var(--ocean); color: rgb(var(--color-on-primary)); }
.err { color: var(--danger); font-size: 13px; margin: 0; }
.redo { background: none; border: 0; color: rgb(var(--color-ocean-text)); font-weight: 700; font-size: 15px; min-height: 44px; cursor: pointer; }
</style>
