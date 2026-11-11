<template>
  <div class="post-form">
    <div class="segmented" role="radiogroup" :aria-label="t('posts.form.typePost')">
      <button type="button" role="radio" :aria-checked="form.type === 'post'" class="seg-opt" :class="{ active: form.type === 'post' }" @click="form.type = 'post'">{{ t('posts.form.typePost') }}</button>
      <button type="button" role="radio" :aria-checked="form.type === 'event'" class="seg-opt" :class="{ active: form.type === 'event' }" @click="form.type = 'event'">{{ t('posts.form.typeEvent') }}</button>
    </div>

    <input
      v-if="form.type === 'event'"
      v-model="form.title"
      type="text"
      :placeholder="t('posts.form.titlePlaceholder')"
    />

    <textarea
      v-model="form.body"
      rows="3"
      :placeholder="t('posts.form.bodyPlaceholder')"
    />

    <div v-if="form.type === 'event'" class="event-fields">
      <input v-model="form.event.date" type="datetime-local" v-ph="'gg/mm/aaaa  --:--'" />
      <LocationPicker
        :lat="form.event.location.lat"
        :lng="form.event.location.lng"
        :name="form.event.location.name"
        :name-placeholder="t('posts.form.locationPlaceholder')"
        @update:lat="v => form.event.location.lat = v"
        @update:lng="v => form.event.location.lng = v"
        @update:name="v => form.event.location.name = v"
      />
    </div>

    <!-- Foto/video scelti insieme al testo, caricati solo al momento del salvataggio -->
    <div
      class="photo-picker"
      :class="{ dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput.click()"
    >
      <input ref="fileInput" type="file" multiple accept="image/*,video/*" class="hidden" @change="onFileChange" />
      <Paperclip :size="16" class="text-muted" />
      <span class="text-sm text-foam">
        {{ t('mediaUploader.dropHint') }} <span class="text-ocean-text">{{ t('mediaUploader.dropHintClick') }}</span>
      </span>
    </div>

    <div v-if="pendingFiles.length" class="photo-preview-grid">
      <div v-for="item in pendingFiles" :key="item.id" class="photo-preview-item">
        <img v-if="!item.isVideo" :src="item.previewUrl" />
        <video v-else :src="item.previewUrl" muted />
        <button type="button" class="photo-preview-remove" @click.stop="removeFile(item)"><X :size="12" /></button>
      </div>
    </div>

    <div v-if="saving && pendingFiles.length" class="upload-progress">
      <div class="upload-progress-bar" :style="{ width: uploadProgress + '%' }"></div>
    </div>

    <!-- Uscita collegata (solo post): luogo, specie e misure compaiono sul post, le coordinate esatte restano nascoste -->
    <div v-if="form.type === 'post' && mySessions.length" class="linked">
      <p class="field-label">{{ t('posts.form.linkedSession') }}</p>
      <label for="linked-session" class="sr-only">{{ t('posts.form.linkedSession') }}</label>
      <select id="linked-session" v-model="form.sessionId" class="fl-inp" :class="{ 'linked-on': chosenSession }" @change="form.featuredCatchId = ''">
        <option value="">{{ t('posts.form.noSession') }}</option>
        <option v-for="s in mySessions" :key="s._id" :value="s._id">{{ s.title || s.location?.name || t('session.untitled') }} · {{ fmtDate(s.date) }}</option>
      </select>
      <p v-if="chosenSession" class="text-muted text-xs">{{ t('posts.form.linkedHint') }}</p>
      <template v-if="chosenSession?.catches?.length">
        <p class="field-label">{{ t('posts.form.featuredCatch') }}</p>
        <div class="chips" role="group" :aria-label="t('posts.form.featuredCatch')">
          <button v-for="c in chosenSession.catches" :key="c._id" type="button" class="chip" :class="{ 'chip-sand': form.featuredCatchId === c._id }" :aria-pressed="form.featuredCatchId === c._id" @click="form.featuredCatchId = c._id">
            {{ c.species }}<template v-if="c.lengthCm"> {{ c.lengthCm }} cm</template>
          </button>
          <button type="button" class="chip" :class="{ 'chip-sand': !form.featuredCatchId }" :aria-pressed="!form.featuredCatchId" @click="form.featuredCatchId = ''">{{ t('posts.form.noCatch') }}</button>
        </div>
      </template>
    </div>

    <p class="field-label">{{ t('posts.form.whoCanSee') }}</p>
    <div class="segmented" role="radiogroup" :aria-label="t('posts.form.whoCanSee')">
      <button v-for="v in ['public', 'group', 'private']" :key="v" type="button" role="radio" :aria-checked="form.visibility === v" class="seg-opt" :class="{ active: form.visibility === v }" @click="form.visibility = v">{{ t(`posts.visibility.${v}`) }}</button>
    </div>
    <select v-if="form.visibility === 'group'" v-model="form.allowedGroups[0]" class="fl-inp" :aria-label="t('posts.visibility.group')">
      <option v-for="g in groups" :key="g._id" :value="g._id">{{ g.name }}</option>
    </select>
    <button type="button" class="fl-btn1 publish" :disabled="saving" @click="submit">
      {{ saving ? t('posts.form.saving') : t('posts.form.submit') }}
    </button>
    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Paperclip, X } from 'lucide-vue-next'
import { useGroupStore } from '../../stores/groups.js'
import { useAuthStore } from '../../stores/auth.js'
import LocationPicker from '../form/LocationPicker.vue'
import api from '../../utils/api.js'
import { compressAll, uploadErrorMessage } from '../../utils/image.js'

const emit = defineEmits(['created'])
const props = defineProps({
  createFn: { type: Function, required: true },
  initialType: { type: String, default: 'post' }
})

const { t } = useI18n()
const groupStore = useGroupStore()
const authStore  = useAuthStore()
const { groups } = storeToRefs(groupStore)

const saving = ref(false)
const error  = ref('')
const uploadProgress = ref(0)

const fileInput = ref(null)
const dragging  = ref(false)
const pendingFiles = ref([])

function defaultVisibility() {
  const pref = authStore.user?.defaultVisibility
  return ['public', 'group', 'private'].includes(pref) ? pref : 'public'
}

function emptyForm() {
  return {
    type: props.initialType === 'event' ? 'event' : 'post',
    title: '',
    body: '',
    visibility: defaultVisibility(),
    allowedGroups: [],
    sessionId: '',
    featuredCatchId: '',
    event: { location: { name: '', lat: null, lng: null }, date: '' }
  }
}
const form = ref(emptyForm())

watch(() => props.initialType, (value) => {
  form.value.type = value === 'event' ? 'event' : 'post'
})

const mySessions = ref([])
const chosenSession = computed(() => mySessions.value.find(s => s._id === form.value.sessionId) || null)
const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

onMounted(async () => {
  if (!groups.value.length) groupStore.fetchGroups()
  try {
    const { data } = await api.get('/sessions', { params: { mine: true, limit: 20 } })
    mySessions.value = (data.data || []).filter(s => s.status !== 'ongoing' && !s._pending)
  } catch { /* il collegamento all'uscita è facoltativo */ }
})
onBeforeUnmount(() => clearPendingFiles())

function addFiles(files) {
  for (const file of files) {
    if (!/^image\/|^video\//.test(file.type)) continue
    pendingFiles.value.push({
      id: `${Date.now()}_${Math.random()}`,
      file,
      isVideo: file.type.startsWith('video/'),
      previewUrl: URL.createObjectURL(file)
    })
  }
}
function onFileChange(e) { addFiles([...e.target.files]); e.target.value = '' }
function onDrop(e) { dragging.value = false; addFiles([...e.dataTransfer.files]) }

function removeFile(item) {
  URL.revokeObjectURL(item.previewUrl)
  pendingFiles.value = pendingFiles.value.filter(f => f.id !== item.id)
}

function clearPendingFiles() {
  pendingFiles.value.forEach(f => URL.revokeObjectURL(f.previewUrl))
  pendingFiles.value = []
}

async function submit() {
  error.value = ''
  if (!form.value.body.trim()) { error.value = t('posts.form.bodyRequired'); return }
  if (form.value.visibility === 'group' && !form.value.allowedGroups[0]) {
    error.value = t('posts.form.groupRequired'); return
  }
  saving.value = true
  uploadProgress.value = 0
  try {
    const payload = { ...form.value }
    if (payload.type !== 'event') delete payload.event
    if (payload.type === 'event' || !payload.sessionId) { delete payload.sessionId; delete payload.featuredCatchId }
    if (!payload.featuredCatchId) delete payload.featuredCatchId
    let created = await props.createFn(payload)

    if (pendingFiles.value.length) {
      const fd = new FormData()
      for (const f of await compressAll(pendingFiles.value.map(i => i.file))) fd.append('files', f)
      // Niente Content-Type esplicito: senza il boundary generato dal browser
      // per il FormData, il multipart non è più parsabile lato server.
      await api.post(`/media/upload/post/${created._id}`, fd, {
        onUploadProgress: e => { uploadProgress.value = Math.round((e.loaded / e.total) * 100) }
      })
      const { data } = await api.get(`/posts/${created._id}`)
      created = data
    }

    emit('created', created)
    clearPendingFiles()
    form.value = emptyForm()
  } catch (e) {
    error.value = uploadErrorMessage(e, t)
  } finally {
    saving.value = false
    uploadProgress.value = 0
  }
}
</script>

<style scoped>
.post-form    { @apply flex flex-col gap-2; }
.publish { width: 100%; margin-top: 12px; }
.linked-on { border-color: rgb(var(--color-ocean-text)); }
.segmented { @apply flex gap-1 p-1 bg-surface-2 border border-border rounded-full; }
.seg-opt { @apply flex-1 min-h-[44px] rounded-full bg-transparent border-none text-sm font-semibold text-foam cursor-pointer; }
.seg-opt.active { @apply bg-ocean text-on-primary; }
.field-label { @apply text-xs font-bold uppercase text-muted mt-2; letter-spacing: 0.14em; }
.linked { @apply flex flex-col gap-2; }
.chips { @apply flex flex-wrap gap-2; }
.chip { @apply inline-flex items-center min-h-[44px] px-4 rounded-full border border-border bg-surface text-foam text-sm font-semibold cursor-pointer; }
.chip-sand { @apply border-sand text-sand-text; background: rgb(var(--color-sand) / 0.15); }
.sr-only { @apply absolute w-px h-px overflow-hidden; clip: rect(0 0 0 0); }
.event-fields { @apply flex flex-col gap-2; }
.error-msg { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }
textarea, input:not([type=file]):not([type=checkbox]) { width: 100%; box-sizing: border-box; min-height: 52px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface); color: var(--foam); font-size: 16px; padding: .8rem 1rem; outline: none; }
textarea { min-height: 96px; resize: none; }

.photo-picker {
  @apply flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border rounded-lg
         cursor-pointer transition-all duration-200 hover:border-ocean hover:bg-ocean/5;
}
.photo-picker.dragging { @apply border-ocean bg-ocean/5; }

.photo-preview-grid {
  @apply grid gap-2;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
}
.photo-preview-item {
  @apply relative aspect-square bg-surface-2 rounded-sm overflow-hidden;
}
.photo-preview-item img, .photo-preview-item video {
  @apply w-full h-full object-cover;
}
.photo-preview-remove {
  @apply absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 border-none
         text-white cursor-pointer flex items-center justify-center transition-colors;
}

.upload-progress {
  @apply h-1.5 bg-surface-2 rounded-full overflow-hidden;
}
.upload-progress-bar {
  @apply h-full bg-ocean rounded-full transition-all duration-200;
}
</style>
