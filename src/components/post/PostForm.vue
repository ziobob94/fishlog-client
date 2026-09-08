<template>
  <div class="card post-form">
    <div class="type-toggle">
      <button
        class="btn btn-sm"
        :class="form.type === 'post' ? 'btn-primary' : 'btn-ghost'"
        @click="form.type = 'post'"
      >{{ t('posts.form.typePost') }}</button>
      <button
        class="btn btn-sm"
        :class="form.type === 'event' ? 'btn-primary' : 'btn-ghost'"
        @click="form.type = 'event'"
      >{{ t('posts.form.typeEvent') }}</button>
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
      <input v-model="form.event.date" type="datetime-local" />
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
        {{ t('mediaUploader.dropHint') }} <span class="text-ocean">{{ t('mediaUploader.dropHintClick') }}</span>
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

    <div class="visibility-row">
      <select v-model="form.visibility">
        <option value="public">{{ t('posts.visibility.public') }}</option>
        <option value="group">{{ t('posts.visibility.group') }}</option>
        <option value="private">{{ t('posts.visibility.private') }}</option>
      </select>
      <select v-if="form.visibility === 'group'" v-model="form.allowedGroups[0]">
        <option v-for="g in groups" :key="g._id" :value="g._id">{{ g.name }}</option>
      </select>
      <button class="btn btn-primary btn-sm ml-auto" :disabled="saving" @click="submit">
        {{ saving ? t('posts.form.saving') : t('posts.form.submit') }}
      </button>
    </div>
    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Paperclip, X } from 'lucide-vue-next'
import { useGroupStore } from '../../stores/groups.js'
import { useAuthStore } from '../../stores/auth.js'
import LocationPicker from '../form/LocationPicker.vue'
import api from '../../utils/api.js'

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
    event: { location: { name: '', lat: null, lng: null }, date: '' }
  }
}
const form = ref(emptyForm())

watch(() => props.initialType, (value) => {
  form.value.type = value === 'event' ? 'event' : 'post'
})

onMounted(() => { if (!groups.value.length) groupStore.fetchGroups() })
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
    let created = await props.createFn(payload)

    if (pendingFiles.value.length) {
      const fd = new FormData()
      for (const item of pendingFiles.value) fd.append('files', item.file)
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
    error.value = e.response?.data?.error || t('common.error')
  } finally {
    saving.value = false
    uploadProgress.value = 0
  }
}
</script>

<style scoped>
.post-form    { @apply flex flex-col gap-2; }
.type-toggle  { @apply flex gap-2; }
.event-fields { @apply flex flex-col gap-2; }
.visibility-row { @apply flex gap-2 items-center; }
.error-msg { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }
textarea, input, select { @apply text-sm; }

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
