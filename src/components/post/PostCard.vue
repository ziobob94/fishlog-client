<template>
  <div class="card post-card">
    <div class="post-header">
      <div class="post-author">
        <img v-if="post.author?.avatar" :src="post.author.avatar" class="mini-avatar" />
        <span v-else class="mini-placeholder">{{ initials(post.author) }}</span>
        <div>
          <div class="text-sm font-medium">{{ post.author?.displayName || post.author?.email }}</div>
          <div class="text-xs text-muted">{{ formatDate(post.createdAt) }}</div>
        </div>
      </div>
      <span v-if="post.type === 'event'" class="badge badge-ocean">{{ t('posts.eventBadge') }}</span>
      <span v-if="post.visibility === 'group'" class="badge badge-sand">{{ groupNames }}</span>
      <span v-else-if="post.visibility === 'private'" class="badge badge-sand">{{ t('posts.visibility.private') }}</span>
    </div>

    <h3 v-if="post.title" class="post-title">{{ post.title }}</h3>
    <p class="post-body">{{ post.body }}</p>

    <div v-if="post.type === 'event'" class="event-info">
      <span v-if="post.event?.location?.name" style="display:inline-flex;align-items:center;gap:.4rem"><MapPin :size="14" /> {{ post.event.location.name }}</span>
      <span v-if="post.event?.date" style="display:inline-flex;align-items:center;gap:.4rem"><Calendar :size="14" /> {{ formatDate(post.event.date) }}</span>
      <span class="badge" :class="post.event?.status === 'open' ? 'badge-ocean' : 'badge-sand'">
        {{ post.event?.status === 'open' ? t('posts.event.open') : t('posts.event.closed') }}
      </span>
      <button
        v-if="isAuthor && post.event?.status === 'open'"
        class="btn btn-ghost btn-sm"
        @click="$emit('close-event', post)"
      >{{ t('posts.event.closeAction') }}</button>
    </div>

    <div v-if="post.type === 'event' && post.responses?.length" class="responses-list">
      <div v-for="r in post.responses" :key="r._id" class="response-row">
        <span class="mini-placeholder">{{ initials(r.user) }}</span>
        <span class="text-sm">{{ r.user?.displayName || r.user?.email }}: {{ r.message }}</span>
      </div>
    </div>

    <div v-if="post.type === 'event' && post.event?.status === 'open'" class="respond-row">
      <input
        v-model="responseText"
        type="text"
        :placeholder="t('posts.event.respondPlaceholder')"
        @keydown.enter="submitResponse"
      />
      <button class="btn btn-secondary btn-sm" @click="submitResponse">{{ t('posts.event.respondAction') }}</button>
    </div>

    <div v-if="isAuthor" class="post-actions">
      <button class="btn btn-danger btn-sm" @click="$emit('delete', post)">{{ t('common.delete') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MapPin, Calendar } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth.js'

const props = defineProps({ post: { type: Object, required: true } })
const emit  = defineEmits(['delete', 'close-event', 'respond'])

const { t } = useI18n()
const auth  = useAuthStore()
const responseText = ref('')

const isAuthor = computed(() => props.post.author?._id === auth.user?._id || auth.user?.role === 'admin')
const groupNames = computed(() => props.post.allowedGroups?.map(g => g.name).join(', '))

function initials(u) {
  const name = u?.displayName || u?.email || '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString() : ''
}

function submitResponse() {
  if (!responseText.value.trim()) return
  emit('respond', props.post, responseText.value)
  responseText.value = ''
}
</script>

<style scoped>
.post-card    { @apply flex flex-col gap-2; }
.post-header  { @apply flex items-center gap-2; }
.post-author  { @apply flex items-center gap-2 flex-1; }
.post-title   { @apply font-semibold; }
.post-body    { @apply text-sm whitespace-pre-wrap; }

.mini-avatar { @apply w-7 h-7 rounded-full object-cover; }
.mini-placeholder {
  @apply w-7 h-7 rounded-full border border-ocean text-ocean flex items-center
         justify-center text-[0.65rem] font-bold shrink-0;
  background: var(--ocean-glow);
}

.event-info     { @apply flex items-center gap-3 text-sm text-muted flex-wrap; }
.responses-list { @apply flex flex-col gap-1.5 border-t border-border pt-2; }
.response-row   { @apply flex items-center gap-2; }
.respond-row    { @apply flex gap-2; }
.respond-row input { @apply text-sm flex-1; }
.post-actions   { @apply flex gap-2 border-t border-border pt-2; }
</style>
