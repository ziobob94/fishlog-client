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

    <div v-if="post.media?.length" class="media-grid">
      <img
        v-for="m in post.media"
        :key="m._id"
        :src="m.url"
        class="media-thumb"
        @click="lightboxItem = m"
      />
    </div>

    <div v-if="post.type === 'event'" class="attendance-block">
      <div v-if="post.event?.status === 'open'" class="attendance-actions my-2">
        <div class="attendance-buttons">
          <button
            class="btn btn-sm"
            :class="myAttendance?.status === 'going' ? 'btn-primary' : 'btn-ghost'"
            @click="setAttendance('going')"
          >{{ t('posts.event.attendance.going') }}</button>
          <button
            class="btn btn-sm"
            :class="myAttendance?.status === 'maybe' ? 'btn-primary' : 'btn-ghost'"
            @click="setAttendance('maybe')"
          >{{ t('posts.event.attendance.maybe') }}</button>
          <button
            class="btn btn-sm"
            :class="myAttendance?.status === 'not_going' ? 'btn-primary' : 'btn-ghost'"
            @click="setAttendance('not_going')"
          >{{ t('posts.event.attendance.notGoing') }}</button>
        </div>
        <label v-if="myAttendance && myAttendance.status !== 'not_going'" class="guests-input">
          {{ t('posts.event.attendance.guestsLabel') }}
          <input type="number" min="0" v-model.number="guestsInput" @change="setAttendance(myAttendance.status)" />
        </label>
      </div>

      <div class="accordion-separator"></div>

      <button
        v-if="attendeesList.length"
        type="button"
        class="accordion-toggle"
        @click="showAttendees = !showAttendees"
      >
        <span><Users :size="15" /> {{ goingCount }}<template v-if="goingGuests">+{{ goingGuests }}</template> {{ showAttendees ? t('posts.event.attendance.hideList') : t('posts.event.attendance.showList') }}</span>
        <span class="switch" :class="{ on: showAttendees }"><span class="switch-knob"></span></span>
      </button>

      <div v-if="showAttendees && attendeesList.length" class="attendees-list">
        <div v-for="a in attendeesList" :key="a._id" class="attendee-row">
          <img v-if="a.user?.avatar" :src="a.user.avatar" class="mini-avatar" />
          <span v-else class="mini-placeholder">{{ initials(a.user) }}</span>
          <span class="text-sm attendee-name">{{ a.user?.displayName || a.user?.email }}</span>
          <span v-if="a.guests" class="text-xs text-muted">+{{ a.guests }}</span>
          <span class="badge" :class="a.status === 'going' ? 'badge-ocean' : 'badge-sand'">
            {{ t(`posts.event.attendance.${a.status === 'not_going' ? 'notGoing' : a.status}`) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="post.type === 'event' && post.event?.status === 'open'" class="respond-section">
      <div class="respond-row mt-2">
      <textarea
        v-model="responseText"
        rows="2"
        :placeholder="t('posts.event.respondPlaceholder')"
        @keydown.enter.exact.prevent="submitResponse"
      />
      <button class="btn btn-secondary btn-sm" @click="submitResponse">{{ t('posts.event.respondAction') }}</button>
      </div>

      <button
        v-if="post.responses?.length"
        type="button"
        class="accordion-toggle"
        @click="showResponses = !showResponses"
      >
        <span><MessageCircle :size="15" /> {{ post.responses.length }} {{ showResponses ? t('posts.event.hideResponses') : t('posts.event.showResponses') }}</span>
        <span class="switch" :class="{ on: showResponses }"><span class="switch-knob"></span></span>
      </button>

      <div v-if="showResponses && post.responses?.length" class="responses-list">
        <div v-for="r in post.responses" :key="r._id" class="response-row">
          <img v-if="r.user?.avatar" :src="r.user.avatar" class="mini-avatar clickable" @click="selectedUser = r.user" />
          <span v-else class="mini-placeholder clickable" @click="selectedUser = r.user">{{ initials(r.user) }}</span>
          <span class="text-sm">{{ r.message }}</span>
        </div>
      </div>
    </div>

    <template v-if="post.type === 'event' && post.event?.status !== 'open' && post.responses?.length">

    <div class="accordion-separator"></div>

    <button
      type="button"
      class="accordion-toggle"
      @click="showResponses = !showResponses"
    >
      <span><MessageCircle :size="15" /> {{ post.responses.length }} {{ showResponses ? t('posts.event.hideResponses') : t('posts.event.showResponses') }}</span>
      <span class="switch" :class="{ on: showResponses }"><span class="switch-knob"></span></span>
    </button>

    <div v-if="showResponses" class="responses-list">
      <div v-for="r in post.responses" :key="r._id" class="response-row">
        <img v-if="r.user?.avatar" :src="r.user.avatar" class="mini-avatar clickable" @click="selectedUser = r.user" />
        <span v-else class="mini-placeholder clickable" @click="selectedUser = r.user">{{ initials(r.user) }}</span>
        <span class="text-sm">{{ r.message }}</span>
      </div>
    </div>

    </template>

    <div class="engagement-row">
      <button
        class="btn btn-ghost btn-sm like-btn"
        :class="{ liked: isLiked }"
        @click="$emit('like', post)"
      ><Heart :size="14" :fill="isLiked ? 'currentColor' : 'none'" /> {{ post.likes?.length || 0 }}</button>
      <button v-if="post.type !== 'event'" class="btn btn-ghost btn-sm" @click="showComments = !showComments">
        <MessageCircle :size="14" /> {{ post.comments?.length || 0 }}
      </button>
      <button v-if="isAuthor" class="btn btn-danger btn-sm ml-auto" @click="$emit('delete', post)">{{ t('common.delete') }}</button>
    </div>

    <div v-if="post.type !== 'event' && showComments" class="comments-block">
      <div v-if="post.comments?.length" class="comments-list">
        <div v-for="c in post.comments" :key="c._id" class="comment-row">
          <img v-if="c.user?.avatar" :src="c.user.avatar" class="mini-avatar" />
          <span v-else class="mini-placeholder">{{ initials(c.user) }}</span>
          <div class="comment-body">
            <span class="text-sm"><strong>{{ c.user?.displayName || c.user?.email }}</strong> {{ c.message }}</span>
          </div>
          <button
            v-if="c.user?._id === auth.user?._id || isAuthor"
            class="btn btn-ghost btn-sm comment-remove"
            @click="$emit('delete-comment', post, c)"
          ><X :size="12" /></button>
        </div>
      </div>
      <div class="comment-row-input">
        <input
          v-model="commentText"
          type="text"
          :placeholder="t('posts.comments.placeholder')"
          @keydown.enter="submitComment"
        />
        <button class="btn btn-secondary btn-sm" @click="submitComment">{{ t('posts.comments.send') }}</button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="lightboxItem" class="lightbox" @click.self="lightboxItem = null">
        <button class="lightbox-close" @click="lightboxItem = null"><X :size="18" /></button>
        <img :src="lightboxItem.url" class="lightbox-img" />
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedUser" class="user-modal-overlay" @click.self="selectedUser = null">
        <div class="user-modal">
          <button class="user-modal-close" @click="selectedUser = null"><X :size="16" /></button>
          <img v-if="selectedUser.avatar" :src="selectedUser.avatar" class="user-modal-avatar" />
          <span v-else class="mini-placeholder user-modal-avatar">{{ initials(selectedUser) }}</span>
          <h3 class="user-modal-name">{{ selectedUser.displayName || selectedUser.email }}</h3>
          <p v-if="selectedUser.email && selectedUser.displayName" class="text-sm text-muted">{{ selectedUser.email }}</p>
          <RouterLink
            v-if="selectedUser._id"
            :to="`/users/${selectedUser._id}`"
            class="btn btn-secondary btn-sm mt-2"
            @click="selectedUser = null"
          >{{ t('posts.userModal.viewProfile') }}</RouterLink>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { RouterLink } from 'vue-router'
  import { MapPin, Calendar, Heart, MessageCircle, X, Users } from 'lucide-vue-next'
  import { useAuthStore } from '../../stores/auth.js'

  const props = defineProps({ post: { type: Object, required: true } })
  const emit = defineEmits(['delete', 'close-event', 'respond', 'like', 'comment', 'delete-comment', 'attend'])

  const { t } = useI18n()
  const auth = useAuthStore()
  const responseText = ref('')
  const commentText = ref('')
  const showComments = ref(false)
  const showAttendees = ref(false)
  const showResponses = ref(false)
  const lightboxItem = ref(null)
  const selectedUser = ref(null)

  const isAuthor = computed(() => props.post.author?._id === auth.user?._id || auth.user?.role === 'admin')
  const isLiked = computed(() => props.post.likes?.some(id => id === auth.user?._id))
  const groupNames = computed(() => props.post.allowedGroups?.map(g => g.name).join(', '))

  const attendeesList = computed(() => props.post.event?.attendees || [])
  const myAttendance = computed(() => attendeesList.value.find(a => a.user?._id === auth.user?._id))
  const goingCount = computed(() => attendeesList.value.filter(a => a.status === 'going').length)
  const goingGuests = computed(() => attendeesList.value.filter(a => a.status === 'going').reduce((sum, a) => sum + (a.guests || 0), 0))

  const guestsInput = ref(myAttendance.value?.guests || 0)
  watch(myAttendance, (a) => { guestsInput.value = a?.guests || 0 })

  function setAttendance(status) {
    emit('attend', props.post, status, guestsInput.value)
  }

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
    showResponses.value = true
  }

  function submitComment() {
    if (!commentText.value.trim()) return
    emit('comment', props.post, commentText.value)
    commentText.value = ''
  }
</script>

<style scoped>
  .post-card {
    @apply flex flex-col gap-2;
  }

  .post-header {
    @apply flex items-center gap-2;
  }

  .post-author {
    @apply flex items-center gap-2 flex-1;
  }

  .post-title {
    @apply font-semibold;
  }

  .post-body {
    @apply text-sm whitespace-pre-wrap;
  }

  .mini-avatar {
    @apply w-7 h-7 rounded-full object-cover;
  }

  .mini-placeholder {
    @apply w-7 h-7 rounded-full border border-ocean text-ocean flex items-center justify-center text-[0.65rem] font-bold shrink-0;
    background: var(--ocean-glow);
  }

  .clickable {
    @apply cursor-pointer transition-opacity;
  }

  .clickable:hover {
    @apply opacity-75;
  }

  .user-modal-overlay {
    @apply fixed inset-0 bg-black/60 flex items-center justify-center;
    z-index: 1000;
  }

  .user-modal {
    @apply card relative flex flex-col items-center gap-1.5 text-center p-6 w-[90%] max-w-xs;
  }

  .user-modal-close {
    @apply absolute top-2 right-2 w-7 h-7 rounded-full bg-transparent border-none text-muted cursor-pointer flex items-center justify-center hover:text-foam;
  }

  .user-modal-avatar {
    @apply w-16 h-16 rounded-full object-cover text-base;
  }

  .user-modal-name {
    @apply font-semibold text-base mt-1;
  }

  .media-grid {
    @apply grid gap-1.5;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .media-thumb {
    @apply w-full aspect-square object-cover rounded-sm cursor-pointer;
  }

  .lightbox {
    @apply fixed inset-0 bg-black/90 flex items-center justify-center;
    z-index: 1000;
  }

  .lightbox-img {
    @apply max-w-[90vw] max-h-[90vh] object-contain rounded-sm;
  }

  .lightbox-close {
    @apply absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 border-none text-white cursor-pointer;
  }

  .attendance-block {
    @apply flex flex-col gap-2 border-t border-border pt-2;
  }

  .attendance-actions {
    @apply flex flex-col gap-2;
  }

  .attendance-buttons {
    @apply flex items-stretch gap-3;
  }

  .attendance-buttons .btn {
    @apply flex-1;
  }

  .guests-input {
    @apply flex items-center gap-1.5 text-xs text-muted;
  }

  .guests-input input {
    @apply w-14 text-sm;
  }

  .attendees-list {
    @apply flex flex-col gap-1.5 overflow-y-auto;
    max-height: 9.5rem;
  }

  .attendee-row {
    @apply flex items-center gap-2 w-full;
  }

  .attendee-name {
    @apply flex-1 min-w-0 truncate;
  }

  .accordion-separator {
    @apply border-t border-border;
  }

  .accordion-toggle {
    @apply flex items-center justify-between w-full text-sm font-medium text-foam bg-transparent border-none cursor-pointer px-0 py-2 transition-colors;
  }

  .accordion-toggle:hover {
    @apply text-ocean;
  }

  .accordion-toggle span:first-child {
    @apply inline-flex items-center gap-2;
  }

  .switch {
    @apply relative inline-flex items-center w-9 h-5 rounded-full bg-surface-2 border border-border shrink-0 transition-colors;
  }

  .switch.on {
    @apply bg-ocean border-ocean;
  }

  .switch-knob {
    @apply absolute left-0.5 w-3.5 h-3.5 rounded-full bg-muted transition-transform duration-200;
  }

  .switch.on .switch-knob {
    @apply bg-white;
    transform: translateX(1rem);
  }

  .event-info {
    @apply flex items-center gap-3 text-sm text-muted flex-wrap;
  }

  .responses-list {
    @apply flex flex-col gap-1.5 pt-2 overflow-y-auto;
    max-height: 10.5rem;
  }

  .response-row {
    @apply flex items-center gap-2;
  }

  .respond-section {
    @apply flex flex-col gap-2 border-t border-border pt-2;
  }

  .respond-label {
    @apply text-xs text-muted font-medium;
  }

  .respond-row {
    @apply flex flex-col gap-2;
  }

  .respond-row textarea {
    @apply text-sm resize-none;
  }

  .respond-row .btn {
    @apply self-end;
  }

  .post-actions {
    @apply flex gap-2 border-t border-border pt-2;
  }

  .engagement-row {
    @apply flex items-center gap-2 border-t border-border pt-2;
  }

  .like-btn.liked {
    @apply text-danger border-danger;
  }

  .ml-auto {
    margin-left: auto;
  }

  .comments-block {
    @apply flex flex-col gap-2 border-t border-border pt-2;
  }

  .comments-list {
    @apply flex flex-col gap-1.5;
  }

  .comment-row {
    @apply flex items-center gap-2;
  }

  .comment-body {
    @apply flex-1 min-w-0;
  }

  .comment-remove {
    @apply shrink-0 px-1.5;
  }

  .comment-row-input {
    @apply flex gap-2;
  }

  .comment-row-input input {
    @apply text-sm flex-1;
  }
</style>
