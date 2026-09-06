<template>
  <div class="card post-form">
    <template v-if="!createdPost">
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
    </template>

    <template v-else>
      <p class="text-sm">{{ t('posts.form.addPhotosHint') }}</p>
      <MediaUploader
        :session-id="createdPost._id"
        :media="createdPost.media"
        :upload-url="`/media/upload/post/${createdPost._id}`"
        :item-base-url="`/media/post/${createdPost._id}`"
        @update="refreshCreatedPost"
      />
      <button class="btn btn-primary btn-sm ml-auto" @click="finish">{{ t('posts.form.done') }}</button>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useGroupStore } from '../../stores/groups.js'
import { useAuthStore } from '../../stores/auth.js'
import LocationPicker from '../form/LocationPicker.vue'
import MediaUploader from '../MediaUploader.vue'
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
const createdPost = ref(null)

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
  if (createdPost.value) return
  form.value.type = value === 'event' ? 'event' : 'post'
})

onMounted(() => { if (!groups.value.length) groupStore.fetchGroups() })

async function submit() {
  error.value = ''
  if (!form.value.body.trim()) { error.value = t('posts.form.bodyRequired'); return }
  if (form.value.visibility === 'group' && !form.value.allowedGroups[0]) {
    error.value = t('posts.form.groupRequired'); return
  }
  saving.value = true
  try {
    const payload = { ...form.value }
    if (payload.type !== 'event') delete payload.event
    const created = await props.createFn(payload)
    createdPost.value = created
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error')
  } finally { saving.value = false }
}

async function refreshCreatedPost() {
  if (!createdPost.value) return
  const { data } = await api.get(`/posts/${createdPost.value._id}`)
  createdPost.value = data
}

function finish() {
  emit('created', createdPost.value)
  createdPost.value = null
  form.value = emptyForm()
}
</script>

<style scoped>
.post-form    { @apply flex flex-col gap-2; }
.type-toggle  { @apply flex gap-2; }
.event-fields { @apply flex flex-col gap-2; }
.visibility-row { @apply flex gap-2 items-center; }
.error-msg { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }
textarea, input, select { @apply text-sm; }
</style>
