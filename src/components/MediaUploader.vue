<template>
  <div class="flex flex-col gap-4">
    <!-- Drop zone -->
    <div
      class="flex items-center justify-center min-h-28 border-2 border-dashed border-border rounded-lg
             cursor-pointer transition-all duration-200"
      :class="dragging ? 'border-ocean bg-ocean/5' : 'hover:border-ocean hover:bg-ocean/5'"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput.click()"
    >
      <input ref="fileInput" type="file" multiple accept="image/*,video/*" class="hidden" @change="onFileChange" />
      <div class="flex flex-col items-center gap-1.5 text-center px-4">
        <span class="text-3xl">📎</span>
        <p class="text-sm text-foam">
          Trascina foto / video o <span class="text-ocean">clicca per selezionare</span>
        </p>
        <span class="text-xs text-muted">JPG, PNG, WEBP, HEIC, MP4, MOV — max 200MB</span>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="uploading" class="flex flex-col gap-1.5">
      <div class="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div class="h-full bg-ocean rounded-full transition-all duration-200" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="text-xs text-muted text-center">Upload {{ progress }}%</span>
    </div>

    <!-- Grid -->
    <div v-if="media.length" class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))">
      <div v-for="item in media" :key="item._id" class="flex flex-col gap-1.5">
        <div class="relative aspect-[4/3] bg-surface-2 rounded-sm overflow-hidden group">
          <img v-if="item.type === 'photo'" :src="item.url" loading="lazy" class="w-full h-full object-cover" />
          <video v-else :src="item.url" controls preload="metadata" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button class="overlay-btn" @click="lightboxItem = item">🔍</button>
            <button class="overlay-btn" @click="confirmDelete(item)">🗑</button>
          </div>
          <span class="absolute bottom-1.5 right-1.5 text-sm">
            {{ item.type === 'photo' ? '📷' : '🎬' }}
          </span>
        </div>
        <input
          v-model="item.caption"
          type="text"
          placeholder="Didascalia..."
          class="text-xs py-1.5"
          @blur="saveCaption(item)"
          @keydown.enter="saveCaption(item)"
        />
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightboxItem"
        class="fixed inset-0 z-[1000] bg-black/92 flex items-center justify-center"
        @click.self="lightboxItem = null"
      >
        <button class="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 border-none text-white cursor-pointer text-base transition-colors"
          @click="lightboxItem = null">✕</button>
        <img v-if="lightboxItem.type === 'photo'" :src="lightboxItem.url" class="max-w-[90vw] max-h-[90vh] object-contain rounded-sm" />
        <video v-else :src="lightboxItem.url" controls autoplay class="max-w-[90vw] max-h-[90vh] rounded-sm" />
      </div>
    </Teleport>

    <!-- Confirm delete -->
    <Teleport to="body">
      <div v-if="deleteTarget"
        class="fixed inset-0 z-[1001] bg-black/60 flex items-center justify-center"
        @click.self="deleteTarget = null"
      >
        <div class="card w-[90%] max-w-sm">
          <h3 class="font-bold mb-1">Elimina media</h3>
          <p class="text-muted text-sm mt-1">L'operazione non è reversibile.</p>
          <div class="flex gap-3 justify-end mt-5">
            <button class="btn btn-ghost btn-sm" @click="deleteTarget = null">Annulla</button>
            <button class="btn btn-danger btn-sm" @click="doDelete">Elimina</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../utils/api.js'

const props = defineProps({
  sessionId: { type: String, required: true },
  media:     { type: Array, default: () => [] }
})
const emit = defineEmits(['update'])

const fileInput    = ref(null)
const dragging     = ref(false)
const uploading    = ref(false)
const progress     = ref(0)
const lightboxItem = ref(null)
const deleteTarget = ref(null)

function onDrop(e)      { dragging.value = false; upload([...e.dataTransfer.files]) }
function onFileChange(e){ upload([...e.target.files]); e.target.value = '' }

async function upload(files) {
  if (!files.length) return
  uploading.value = true; progress.value = 0
  const fd = new FormData()
  for (const f of files) fd.append('files', f)
  try {
    await api.post(`/media/upload/${props.sessionId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => { progress.value = Math.round((e.loaded / e.total) * 100) }
    })
    emit('update')
  } finally { uploading.value = false; progress.value = 0 }
}

async function saveCaption(item) {
  await api.patch(`/media/${props.sessionId}/${item._id}/caption`, { caption: item.caption })
}

function confirmDelete(item) { deleteTarget.value = item }
async function doDelete() {
  await api.delete(`/media/${props.sessionId}/${deleteTarget.value._id}`)
  emit('update')
  deleteTarget.value = null
}
</script>

<style scoped>
.overlay-btn {
  @apply bg-white/10 border border-white/20 rounded text-white cursor-pointer text-lg px-2 py-1 transition-colors hover:bg-white/25;
}
</style>