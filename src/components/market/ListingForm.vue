<template>
  <form class="card" @submit.prevent="submit">
    <div class="form-group">
      <label>{{ t('market.form.title') }}</label>
      <input v-model="form.title" type="text" required />
    </div>

    <div class="form-group mt-2">
      <label>{{ t('market.form.description') }}</label>
      <textarea v-model="form.description" rows="4"></textarea>
    </div>

    <div class="form-row mt-2">
      <div class="form-group">
        <label>{{ t('market.form.category') }}</label>
        <select v-model="form.category">
          <option v-for="c in categories" :key="c" :value="c">{{ t(`market.categories.${c}`) }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('market.form.condition') }}</label>
        <select v-model="form.condition" required>
          <option value="nuovo">{{ t('market.condition.nuovo') }}</option>
          <option value="usato">{{ t('market.condition.usato') }}</option>
        </select>
      </div>
    </div>

    <div class="form-row mt-2">
      <div class="form-group">
        <label>{{ t('market.form.price') }}</label>
        <input v-model.number="form.price" type="number" min="0" step="0.01" required />
      </div>
      <div class="form-group">
        <label>{{ t('market.form.location') }}</label>
        <input v-model="form.location.name" type="text" :placeholder="t('market.form.locationPlaceholder')" />
      </div>
    </div>

    <div class="form-group mt-2">
      <label>{{ t('market.form.photos') }}</label>
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="hidden" @change="onFilesChange" />
      <button type="button" class="btn btn-secondary btn-sm" @click="fileInput.click()">
        {{ t('market.form.addPhotos') }}
      </button>

      <div v-if="existingMedia.length || pendingFiles.length" class="media-preview mt-2">
        <div v-for="m in existingMedia" :key="m._id" class="media-thumb">
          <img :src="m.url" />
          <button type="button" class="media-remove" @click="$emit('remove-media', m._id)"><X :size="12" /></button>
        </div>
        <div v-for="(f, i) in pendingFiles" :key="i" class="media-thumb">
          <img :src="previewUrls[i]" />
          <button type="button" class="media-remove" @click="removePending(i)"><X :size="12" /></button>
        </div>
      </div>
    </div>

    <p v-if="error" class="error-msg mt-3">{{ error }}</p>

    <div class="mt-4 flex gap-2">
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? t('market.form.saving') : submitLabel }}
      </button>
      <RouterLink to="/market" class="btn btn-ghost">{{ t('common.cancel') }}</RouterLink>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'

const { t } = useI18n()
const props = defineProps({
  initial: { type: Object, default: () => ({}) },
  categories: { type: Array, default: () => [] },
  submitLabel: { type: String, required: true },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'remove-media'])

const form = reactive({
  title: props.initial.title || '',
  description: props.initial.description || '',
  category: props.initial.category || 'altro',
  condition: props.initial.condition || 'usato',
  price: props.initial.price ?? null,
  location: { name: props.initial.location?.name || '' }
})

const existingMedia = computed(() => props.initial.media || [])

const fileInput = ref(null)
const pendingFiles = ref([])
const previewUrls = ref([])

function onFilesChange(e) {
  const files = Array.from(e.target.files || [])
  pendingFiles.value.push(...files)
  previewUrls.value.push(...files.map(f => URL.createObjectURL(f)))
  e.target.value = ''
}

function removePending(i) {
  URL.revokeObjectURL(previewUrls.value[i])
  pendingFiles.value.splice(i, 1)
  previewUrls.value.splice(i, 1)
}

onBeforeUnmount(() => previewUrls.value.forEach(u => URL.revokeObjectURL(u)))

function submit() {
  emit('submit', { ...form }, pendingFiles.value)
}
</script>

<style scoped>
.form-row { @apply grid gap-3; grid-template-columns: 1fr 1fr; }
.hidden { display: none; }
.media-preview { @apply flex flex-wrap gap-2; }
.media-thumb { @apply relative w-20 h-20 rounded overflow-hidden border border-border; }
.media-thumb img { @apply w-full h-full object-cover; }
.media-remove {
  @apply absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5;
}
.error-msg { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }
</style>
