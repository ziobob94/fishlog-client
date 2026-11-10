<template>
  <form class="listing-form" @submit.prevent="submit">
    <p class="field-label">{{ t('market.form.photos') }}</p>
    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="hidden" @change="onFilesChange" />
    <div class="photos">
      <div v-for="(m, i) in existingMedia" :key="m._id" class="photo" :class="{ cover: i === 0 }">
        <img :src="m.url" alt="" />
        <span v-if="i === 0" class="cover-tag">{{ t('market.form.cover') }}</span>
        <button type="button" class="media-remove" :aria-label="t('common.delete')" @click="$emit('remove-media', m._id)"><X :size="14" /></button>
      </div>
      <div v-for="(f, i) in pendingFiles" :key="'p' + i" class="photo" :class="{ cover: !existingMedia.length && i === 0 }">
        <img :src="previewUrls[i]" alt="" />
        <span v-if="!existingMedia.length && i === 0" class="cover-tag">{{ t('market.form.cover') }}</span>
        <button type="button" class="media-remove" :aria-label="t('common.delete')" @click="removePending(i)"><X :size="14" /></button>
      </div>
      <button type="button" class="photo photo-add" @click="fileInput.click()">
        <Plus :size="22" />
        <span>{{ t('market.form.add') }}</span>
      </button>
    </div>

    <label for="lf-title" class="field-label">{{ t('market.form.title') }}</label>
    <input id="lf-title" v-model="form.title" type="text" class="field" required :placeholder="t('market.form.titlePlaceholder')" />

    <p class="field-label">{{ t('market.form.category') }}</p>
    <div class="chips" role="radiogroup" :aria-label="t('market.form.category')">
      <button
        v-for="c in categories" :key="c" type="button" role="radio" :aria-checked="form.category === c"
        class="chip" :class="{ on: form.category === c }" @click="form.category = c"
      >{{ t(`market.categories.${c}`) }}</button>
    </div>

    <p class="field-label">{{ t('market.form.condition') }}</p>
    <div class="segmented" role="radiogroup" :aria-label="t('market.form.condition')">
      <button
        v-for="c in ['nuovo', 'usato']" :key="c" type="button" role="radio" :aria-checked="form.condition === c"
        class="seg-opt" :class="{ active: form.condition === c }" @click="form.condition = c"
      >{{ t(`market.condition.${c}`) }}</button>
    </div>

    <div class="form-row">
      <div>
        <label for="lf-price" class="field-label">{{ t('market.form.price') }}</label>
        <input id="lf-price" v-model.number="form.price" type="number" min="0" step="0.01" required class="field" placeholder="0" />
      </div>
      <div>
        <label for="lf-zone" class="field-label">{{ t('market.form.location') }}</label>
        <input id="lf-zone" v-model="form.location.name" type="text" class="field" :placeholder="t('market.form.locationPlaceholder')" />
      </div>
    </div>

    <label for="lf-desc" class="field-label">{{ t('market.form.description') }}</label>
    <textarea id="lf-desc" v-model="form.description" rows="5" class="field" :placeholder="t('market.form.descriptionPlaceholder')"></textarea>

    <p v-if="error" class="error-msg mt-3">{{ error }}</p>

    <div class="cta-bar">
      <button type="submit" class="btn btn-primary cta" :disabled="saving">
        {{ saving ? t('market.form.saving') : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Plus } from 'lucide-vue-next'

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
  category: props.initial.category || props.categories[0] || 'altro',
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
.listing-form { @apply pb-24; }
.field-label { @apply block text-xs font-bold uppercase text-muted mt-5 mb-2; letter-spacing: 0.14em; }
.listing-form > .field-label:first-child { @apply mt-0; }
.field { @apply w-full min-h-[48px] rounded-xl text-base; }
textarea.field { @apply py-3; }
.hidden { display: none; }

.photos { @apply flex gap-3 overflow-x-auto pb-1; scrollbar-width: none; }
.photo {
  @apply relative shrink-0 w-28 h-28 rounded-xl overflow-hidden border border-border bg-surface-2;
}
.photo img { @apply w-full h-full object-cover; }
.photo.cover { @apply border-ocean border-2; }
.cover-tag { @apply absolute bottom-1.5 left-1.5 rounded-md bg-sand text-on-primary text-[0.7rem] font-extrabold px-2 py-0.5; }
.photo-add {
  @apply flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border bg-transparent text-ocean-text text-xs font-bold cursor-pointer;
}
.media-remove {
  @apply absolute top-1 right-1 w-7 h-7 flex items-center justify-center bg-black/60 text-white rounded-full border-none cursor-pointer;
}

.chips { @apply flex flex-wrap gap-2; }
.chip {
  @apply inline-flex items-center min-h-[44px] px-4 rounded-full border border-border bg-surface text-foam text-sm font-semibold cursor-pointer;
}
.chip.on { @apply bg-ocean border-ocean text-on-primary; }

.segmented { @apply flex gap-1 p-1 bg-surface-2 border border-border rounded-xl; }
.seg-opt { @apply flex-1 min-h-[44px] rounded-lg bg-transparent border-none text-sm font-semibold text-foam cursor-pointer; }
.seg-opt.active { @apply bg-ocean text-on-primary; }

.form-row { @apply grid gap-3; grid-template-columns: 1fr 1fr; }
.error-msg { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }

.cta-bar { @apply fixed left-0 right-0 bottom-0 z-20 px-4 py-3 bg-surface border-t border-border; }
.cta { @apply w-full min-h-[48px] max-w-[1100px] mx-auto; display: flex; }
@media (min-width: 768px) {
  .cta-bar { position: static; @apply border-none bg-transparent px-0 pt-6; }
  .cta { @apply max-w-xs mx-0; }
}
</style>
