<template>
  <article class="post-card">
    <div class="post-header">
      <UserAvatar :user="post.author" :size="36" :label="post.author?.displayName" />
      <div class="post-author">
        <component :is="post.author?._id ? RouterLink : 'span'" :to="post.author?._id ? authorTo : undefined" class="post-author-name">{{ post.author?.displayName || post.author?.email }}</component>
        <span class="post-sub">{{ subtitle }}</span>
      </div>
      <span v-if="post.type === 'event'" class="badge badge-ocean">{{ t('posts.eventBadge') }}</span>
      <span v-if="post.visibility === 'group'" class="badge badge-sand">{{ groupNames }}</span>
      <span v-else-if="post.visibility === 'private'" class="badge badge-sand">{{ t('posts.visibility.private') }}</span>
      <div v-if="isAuthor" class="more-wrap">
        <button type="button" class="more-btn" :aria-label="t('posts.more')" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><MoreHorizontal :size="20" /></button>
        <div v-if="menuOpen" class="more-menu" @click="menuOpen = false">
          <button v-if="post.type === 'event' && post.event?.status === 'open'" type="button" @click="$emit('close-event', post)">{{ t('posts.event.closeAction') }}</button>
          <button type="button" class="danger" @click="$emit('delete', post)"><Trash2 :size="16" /> {{ t('common.delete') }}</button>
        </div>
      </div>
    </div>

    <!-- Post senza foto/video: il testo è il contenuto, subito sotto l'intestazione -->
    <div v-if="!post.media?.length" class="post-lead">
      <h3 v-if="post.title" class="post-title">{{ post.title }}</h3>
      <p class="post-lead-body">{{ post.body }}</p>
      <div v-if="post.type === 'event'" class="event-info">
        <span v-if="post.event?.location?.name" class="inline-flex items-center gap-1.5"><MapPin :size="14" /> {{ post.event.location.name }}</span>
        <span v-if="post.event?.date" class="inline-flex items-center gap-1.5"><Calendar :size="14" /> {{ formatDate(post.event.date) }}</span>
        <span class="badge" :class="post.event?.status === 'open' ? 'badge-ocean' : 'badge-sand'">
          {{ post.event?.status === 'open' ? t('posts.event.open') : t('posts.event.closed') }}
        </span>
      </div>
    </div>

    <div v-if="post.media?.length" class="post-media">
      <div ref="mediaEl" class="media-scroll" @scroll.passive="onMediaScroll">
        <RulerFrame v-for="(m, i) in post.media" :key="m._id" class="media-frame" :ruler="false">
          <video v-if="isVideo(m)" :src="m.url" class="media-thumb" controls playsinline preload="metadata"></video>
          <template v-else>
            <!-- Letterbox: stessa foto sfocata e scurita come sfondo, la foto resta intera -->
            <img :src="m.url" class="media-backdrop" alt="" aria-hidden="true" loading="lazy" decoding="async" />
            <img :src="m.url" class="media-thumb media-thumb-img" alt="" @click="lightboxItem = m" />
          </template>
          <template v-if="i === 0 && featuredCatch" #badge>
            <span class="catch-pill">{{ featuredCatch.species }}{{ featuredCatch.lengthCm ? ` ${featuredCatch.lengthCm} cm` : '' }}</span>
          </template>
        </RulerFrame>
      </div>
      <span v-if="coords" class="media-chip media-coords">{{ coords }}</span>
      <span v-if="post.media.length > 1" class="media-chip media-count">{{ mediaIndex + 1 }} / {{ post.media.length }}</span>
    </div>

    <div class="action-row">
      <LikeButton :liked="isLiked" @toggle="$emit('like', post)" />
      <button v-if="post.type !== 'event'" type="button" class="act-btn" :aria-label="t('posts.comment')" @click="showComments = !showComments">
        <MessageCircle :size="24" />
      </button>
      <button type="button" class="act-btn" :aria-label="t('posts.share')" @click="share">
        <Send :size="24" />
      </button>
      <button type="button" class="act-btn ml-auto -mr-2.5" :class="{ saved: post.saved }" :aria-pressed="!!post.saved" :aria-label="t(post.saved ? 'posts.unsave' : 'posts.save')" @click="$emit('save', post)">
        <Bookmark :size="24" :fill="post.saved ? 'currentColor' : 'none'" />
      </button>
    </div>

    <div class="post-text">
      <span class="likes-label">{{ t('posts.likesCount', { n: post.likes?.length || 0 }, post.likes?.length || 0) }}</span>
      <template v-if="post.media?.length">
      <h3 v-if="post.title" class="post-title">{{ post.title }}</h3>
      <p class="post-body"><strong>{{ post.author?.displayName || post.author?.email }}</strong> {{ post.body }}</p>
      </template>

      <div v-if="post.media?.length && post.type === 'event'" class="event-info">
        <span v-if="post.event?.location?.name" class="inline-flex items-center gap-1.5"><MapPin :size="14" /> {{ post.event.location.name }}</span>
        <span v-if="post.event?.date" class="inline-flex items-center gap-1.5"><Calendar :size="14" /> {{ formatDate(post.event.date) }}</span>
        <span class="badge" :class="post.event?.status === 'open' ? 'badge-ocean' : 'badge-sand'">
          {{ post.event?.status === 'open' ? t('posts.event.open') : t('posts.event.closed') }}
        </span>
      </div>
    </div>

    <!-- Uscita collegata -->
    <RouterLink v-if="post.session" :to="`/session/${post.session._id}`" class="linked-session">
      <span class="linked-ico"><AppIcon name="uscite" :size="20" /></span>
      <span class="linked-text">
        <span class="linked-label">{{ t('posts.linkedSession') }}</span>
        <strong class="truncate">{{ post.session.title || post.session.location?.name || t('session.untitled') }}</strong>
        <span class="text-muted text-xs">{{ formatShort(post.session.date) }} · {{ t('globe.catches', { n: post.session.totalCatches || 0 }, post.session.totalCatches || 0) }}<template v-if="post.session.type"> · {{ post.session.type }}</template></span>
      </span>
      <ChevronRight :size="20" class="text-muted shrink-0" />
    </RouterLink>

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

    <button v-if="post.type !== 'event'" type="button" class="comments-link" @click="showComments = !showComments">
      {{ post.comments?.length ? t('posts.viewComments', { n: post.comments.length }, post.comments.length) : t('posts.addComment') }}
    </button>

    <div v-if="post.type !== 'event' && showComments" class="comments-block">
      <div v-if="post.comments?.length" class="comments-list">
        <div v-for="c in post.comments" :key="c._id" class="comment-row">
          <RouterLink v-if="c.user?._id" :to="`/users/${c.user._id}`" class="post-author-link">
            <img v-if="c.user?.avatar" :src="c.user.avatar" class="mini-avatar" />
            <span v-else class="mini-placeholder">{{ initials(c.user) }}</span>
          </RouterLink>
          <template v-else>
            <img v-if="c.user?.avatar" :src="c.user.avatar" class="mini-avatar" />
            <span v-else class="mini-placeholder">{{ initials(c.user) }}</span>
          </template>
          <div class="comment-body">
            <span class="text-sm"><RouterLink v-if="c.user?._id" :to="`/users/${c.user._id}`" class="comment-author"><strong>{{ c.user?.displayName || c.user?.email }}</strong></RouterLink><strong v-else>{{ c.user?.displayName || c.user?.email }}</strong> {{ c.message }}</span>
            <span class="comment-time text-muted">{{ formatDate(c.createdAt) }}</span>
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
          :aria-label="t('posts.comments.placeholder')"
          @keydown.enter="submitComment"
        />
        <button class="btn btn-primary btn-sm" @click="submitComment">{{ t('posts.comments.send') }}</button>
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
  </article>
</template>

<script setup>
  import UserAvatar from '../UserAvatar.vue'
  import LikeButton from '../motion/LikeButton.vue'
import { toInitials } from '../../utils/initials.js'
import RulerFrame from '../RulerFrame.vue'
import AppIcon from '../AppIcon.vue'
  import { ref, computed, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { RouterLink } from 'vue-router'
  import { MapPin, Calendar, Heart, MessageCircle, X, Users, Trash2, Send, MoreHorizontal, ChevronRight, Bookmark } from 'lucide-vue-next'
  import { useAuthStore } from '../../stores/auth.js'

  const props = defineProps({ post: { type: Object, required: true } })
  const emit = defineEmits(['delete', 'close-event', 'respond', 'like', 'comment', 'delete-comment', 'attend', 'save'])

  const { t } = useI18n()
  const auth = useAuthStore()
  const responseText = ref('')
  const commentText = ref('')
  const showComments = ref(false)
  const showAttendees = ref(false)
  const showResponses = ref(false)
  const lightboxItem = ref(null)
  const selectedUser = ref(null)
  const menuOpen = ref(false)
  const mediaEl = ref(null)
  const mediaIndex = ref(0)

  const authorTo = computed(() => post_authorIsMe() ? '/board' : `/users/${props.post.author._id}`)
  function post_authorIsMe() { return String(props.post.author?._id) === String(auth.user?._id || auth.user?.id) }
  function isVideo(m) { return (m.mimetype || '').startsWith('video/') }
  function onMediaScroll() {
    const el = mediaEl.value
    if (el && el.clientWidth) mediaIndex.value = Math.round(el.scrollLeft / el.clientWidth)
  }

  const place = computed(() => props.post.session?.location?.name || props.post.event?.location?.name || '')
  const coords = computed(() => {
    const loc = props.post.session?.location || props.post.event?.location
    if (loc?.lat == null || loc?.lng == null) return ''
    const lat = Number(loc.lat), lng = Number(loc.lng)
    return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`
  })
  const subtitle = computed(() => [place.value, timeAgo(props.post.createdAt)].filter(Boolean).join(' · '))

  function timeAgo(d) {
    if (!d) return ''
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (mins < 1) return t('posts.time.now')
    if (mins < 60) return t('posts.time.minutes', { n: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t('posts.time.hours', { n: hours })
    if (hours < 48) return t('posts.time.yesterday')
    return formatDate(d)
  }

  function formatShort(d) {
    return d ? new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : ''
  }

  async function share() {
    const text = props.post.body || ''
    try {
      if (navigator.share) await navigator.share({ text, url: window.location.origin + '/feed' })
      else await navigator.clipboard.writeText(text)
    } catch (e) { /* annullato dall'utente */ }
  }

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
return toInitials(name)
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

const featuredCatch = computed(() => {
  const id = props.post.featuredCatch
  return id ? props.post.session?.catches?.find(c => c._id === id) || null : null
})
</script>

<style scoped>
  .post-card {
    @apply flex flex-col gap-2 border-t border-border pt-3.5 px-4 sm:px-0;
  }

  .post-card:first-child { @apply border-t-0 pt-0; }

  .post-header {
    @apply flex items-center gap-2.5;
  }

  .post-author {
    @apply flex flex-col gap-px min-w-0 flex-1;
  }
  .post-author-link { @apply shrink-0 no-underline; }
  .comment-author { @apply no-underline text-foam; }
  .post-author-name { @apply text-[15px] font-bold text-foam truncate no-underline; }
  .post-sub { @apply text-xs text-muted truncate; }

  .more-wrap { @apply relative; }
  .more-btn { @apply flex items-center justify-center w-11 h-11 -mr-2 bg-transparent border-none text-muted cursor-pointer hover:text-foam; }
  .more-menu { @apply absolute right-0 top-11 z-20 min-w-[170px] flex flex-col bg-surface-2 border border-border rounded-xl p-1.5 shadow-lg; }
  .more-menu button { @apply flex items-center gap-2 text-left text-sm font-semibold px-3 min-h-[44px] rounded-lg bg-transparent border-none text-foam cursor-pointer hover:bg-surface; }
  .more-menu button.danger { @apply text-danger; }

  .post-media { @apply relative -mx-4 sm:mx-0; }
  .media-scroll { @apply flex overflow-x-auto snap-x snap-mandatory; scrollbar-width: none; }
  .media-scroll::-webkit-scrollbar { display: none; }
  .media-frame { @apply snap-center shrink-0 w-full bg-surface-2 flex items-center justify-center; }
  .media-chip { @apply absolute top-3 text-xs font-bold text-foam px-2.5 py-1 rounded-full pointer-events-none; background: rgb(var(--color-ink) / 0.82); }
  .media-coords { @apply left-3 font-mono text-[0.7rem] font-medium text-ocean-text; }
  .media-count { @apply right-3; }

  .action-row { @apply flex items-center -ml-2.5; }
  .act-btn { @apply flex items-center justify-center w-11 h-11 bg-transparent border-none text-foam cursor-pointer; }
  .act-btn.liked, .act-btn.saved { @apply text-sand-text; }

  .post-text { @apply flex flex-col gap-1.5; }
  .likes-label { @apply text-sm font-bold text-foam; }
  .post-lead { @apply flex flex-col gap-2 pt-1; }
  .post-lead-body { @apply text-[17px] leading-relaxed text-foam whitespace-pre-wrap break-words; }
  .post-lead .post-title { @apply text-lg; }
  .comments-link { @apply self-start min-h-[36px] bg-transparent border-none px-0 -mt-1 text-sm text-muted cursor-pointer text-left; }

  .post-title {
    @apply font-bold text-base leading-snug;
  }

  .post-body {
    @apply text-[15px] leading-normal whitespace-pre-wrap break-words;
  }

  .mini-avatar {
    @apply w-9 h-9 rounded-full object-cover shrink-0;
  }

  .mini-placeholder {
    @apply w-9 h-9 rounded-full border border-ocean text-ocean-text flex items-center justify-center text-xs font-bold shrink-0;
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
    @apply absolute top-2 right-2 w-11 h-11 rounded-full bg-transparent border-none text-muted cursor-pointer flex items-center justify-center hover:text-foam;
  }

  .user-modal-avatar {
    @apply w-16 h-16 rounded-full object-cover text-base;
  }

  .user-modal-name {
    @apply font-semibold text-base mt-1;
  }

  .catch-pill { @apply inline-block rounded-full px-3 py-1.5 text-[0.8rem] font-extrabold bg-sand; color: #1a1204; }
  .linked-session { @apply flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-2xl border border-border bg-surface no-underline text-foam; }
  .linked-ico { @apply w-10 h-10 shrink-0 rounded-lg bg-surface-2 text-ocean-text flex items-center justify-center; }
  .linked-text { @apply flex flex-col min-w-0; }
  .linked-label { @apply text-xs font-bold uppercase text-ocean-text; letter-spacing: 0.14em; }
  .media-thumb {
    @apply w-full object-contain cursor-pointer block bg-ink;
    height: auto;
    /* Il contenitore segue la proporzione della foto; tetto 4:5 verticale (come i social) */
    max-height: min(125vw, 560px);
  }
  /* Sfondo statico (nessuna animazione, quindi nulla da ridurre con prefers-reduced-motion).
     Il blur viene rasterizzato una volta sola: scala 1.25 per nascondere i bordi sfumati. */
  .media-backdrop {
    @apply absolute inset-0 w-full h-full object-cover pointer-events-none;
    filter: blur(24px) brightness(0.55) saturate(1.1);
    transform: scale(1.25) translateZ(0);
  }
  .media-thumb-img { @apply relative bg-transparent; }

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
    @apply flex items-stretch gap-2;
  }

  .attendance-buttons .btn {
    @apply flex-1 px-2 text-xs;
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
    @apply text-ocean-text;
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
    @apply flex items-center gap-2 border-t border-border/60 pt-2;
  }

  .engagement-row .btn {
    @apply min-h-[36px] px-3 gap-1.5 text-xs font-semibold rounded-full border-transparent bg-surface-2/70 text-foam shadow-none;
  }

  .like-btn.liked {
    @apply text-danger bg-danger/10;
  }

  .delete-btn {
    @apply flex items-center justify-center w-9 h-9 rounded-full bg-transparent border-none text-muted cursor-pointer hover:text-danger hover:bg-danger/10 transition-colors;
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
    @apply flex items-start gap-3 py-1;
  }

  .comment-body { @apply flex flex-col gap-0.5; }
  .comment-time { @apply text-xs; }
  .comment-row .mini-avatar, .comment-row .mini-placeholder { @apply w-9 h-9 shrink-0; }
  .comment-remove { @apply w-11 h-11 p-0; }

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
    @apply text-sm flex-1 rounded-full px-4;
  }
</style>
