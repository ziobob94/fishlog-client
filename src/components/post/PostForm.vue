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
      <input v-model="form.event.location.name" type="text" :placeholder="t('posts.form.locationPlaceholder')" />
      <input v-model="form.event.date" type="datetime-local" />
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
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useGroupStore } from '../../stores/groups.js'
import { useAuthStore } from '../../stores/auth.js'

const emit = defineEmits(['created'])
const props = defineProps({ createFn: { type: Function, required: true } })

const { t } = useI18n()
const groupStore = useGroupStore()
const authStore  = useAuthStore()
const { groups } = storeToRefs(groupStore)

const saving = ref(false)
const error  = ref('')

function defaultVisibility() {
  const pref = authStore.user?.defaultVisibility
  return ['public', 'group', 'private'].includes(pref) ? pref : 'public'
}

function emptyForm() {
  return {
    type: 'post',
    title: '',
    body: '',
    visibility: defaultVisibility(),
    allowedGroups: [],
    event: { location: { name: '' }, date: '' }
  }
}
const form = ref(emptyForm())

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
    emit('created', created)
    form.value = emptyForm()
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error')
  } finally { saving.value = false }
}
</script>

<style scoped>
.post-form    { @apply flex flex-col gap-2; }
.type-toggle  { @apply flex gap-2; }
.event-fields { @apply flex gap-2; }
.visibility-row { @apply flex gap-2 items-center; }
.error-msg { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }
textarea, input, select { @apply text-sm; }
</style>
