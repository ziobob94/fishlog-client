<template>
  <div :class="{ 'chat-fullheight': route.params.userId }">
    <!-- Lista conversazioni -->
    <template v-if="!route.params.userId">
      <div class="page-header">
        <input
          v-model="query" type="text" class="chat-search"
          :placeholder="t('chat.search.placeholder')" @input="onSearch"
        />
        <RouterLink to="/friends" class="btn btn-ghost btn-sm shrink-0">
          <Users :size="16" /> {{ t('chat.friendsLink') }}
        </RouterLink>
      </div>

      <!-- Ricerca attiva: stessa lista sia per amici già in chat (aprono il
           thread) sia per persone nuove (richiesta di amicizia). Sostituisce
           la lista conversazioni finché non si svuota la ricerca. -->
      <div v-if="query.trim().length >= 2" class="search-results">
        <template v-for="u in userStore.results" :key="u._id">
          <button v-if="statusFor(u._id) === 'friends'" type="button" class="search-result-row search-result-clickable" @click="goToThread(u._id)">
            <img v-if="u.avatar" :src="u.avatar" class="mini-avatar" />
            <span v-else class="mini-placeholder">{{ initials(u) }}</span>
            <span class="member-name">{{ u.displayName || u.email }}</span>
            <span class="badge badge-ocean ml-auto">{{ t('chat.search.openChat') }}</span>
          </button>

          <div v-else class="search-result-row">
            <RouterLink :to="`/users/${u._id}`" class="member-info">
              <img v-if="u.avatar" :src="u.avatar" class="mini-avatar" />
              <span v-else class="mini-placeholder">{{ initials(u) }}</span>
              <span class="member-name">{{ u.displayName || u.email }}</span>
            </RouterLink>
            <button
              v-if="!statusFor(u._id)" class="btn btn-secondary btn-sm"
              :disabled="requestStatus[u._id] === 'sending'" @click="sendRequest(u)"
            >{{ t('friends.actions.add') }}</button>
            <span v-else class="badge badge-ocean">{{ t(`friends.status.${statusFor(u._id)}`) }}</span>
          </div>
        </template>
        <p v-if="!userStore.loading && !userStore.results.length" class="no-results">{{ t('chat.search.noResults') }}</p>
      </div>

      <template v-else>
        <div v-if="chatStore.loading" class="state-center"><div class="spinner"></div></div>

        <div v-else-if="!chatStore.conversations.length" class="state-center">
          <div style="font-size:3rem; display:flex; justify-content:center"><MessagesSquare :size="48" /></div>
          <p class="text-muted mt-1">{{ t('chat.empty') }}</p>
        </div>

        <div v-else class="conversations-list">
          <button v-for="c in chatStore.conversations" :key="c._id" class="conversation-row" @click="goToThread(c.user._id)">
            <img v-if="c.user?.avatar" :src="c.user.avatar" class="mini-avatar" />
            <span v-else class="mini-placeholder">{{ initials(c.user) }}</span>
            <div class="conversation-info">
              <span class="conversation-name">{{ c.user?.displayName || c.user?.email }}</span>
              <span class="conversation-preview">{{ previewText(c.lastMessage) }}</span>
            </div>
            <span v-if="c.unreadCount" class="badge badge-ocean">{{ c.unreadCount }}</span>
          </button>
        </div>
      </template>
    </template>

    <!-- Thread con un amico -->
    <template v-else>
      <div class="page-header chat-thread-header pt-4">
        <RouterLink to="/chat" class="btn btn-ghost btn-sm">{{ t('common.back') }}</RouterLink>
        <RouterLink v-if="friend" :to="`/users/${friend._id}`" class="chat-header-info">
          <img v-if="friend.avatar" :src="friend.avatar" class="mini-avatar" />
          <span v-else class="mini-placeholder">{{ initials(friend) }}</span>
          <span class="chat-header-text">
            <span class="chat-header-name">{{ friend.displayName || friend.email }}</span>
            <span v-if="friend.email" class="chat-header-email">{{ friend.email }}</span>
          </span>
        </RouterLink>
        <h2 v-else>...</h2>
      </div>

      <div v-if="threadError" class="error-banner"><AlertTriangle :size="16" /> {{ threadError }}</div>

      <div v-else class="thread">
        <div ref="scrollEl" class="messages-list">
          <div v-if="chatStore.loading && !chatStore.messages.length" class="state-center"><div class="spinner"></div></div>
          <div
            v-for="m in chatStore.messages"
            :key="m._id"
            class="message-row"
            :class="{ mine: m.sender?._id === auth.user?._id }"
          >
            <div class="message-bubble" :class="{ deleted: m.deleted }">
              <span v-if="m.deleted" class="message-text message-deleted-text">
                <Ban :size="14" /> {{ t('chat.deletedMessage') }}
              </span>

              <template v-else>
                <span v-if="!m.type || m.type === 'text'" class="message-text">{{ m.body }}</span>

                <a v-else-if="m.type === 'image'" :href="m.media?.url" target="_blank" rel="noopener">
                  <img :src="m.media?.url" class="message-media-image" />
                </a>

                <video v-else-if="m.type === 'video'" :src="m.media?.url" controls class="message-media-video"></video>

                <audio v-else-if="m.type === 'audio'" :src="m.media?.url" controls class="message-audio"></audio>

                <a v-else-if="m.type === 'file'" :href="m.media?.url" target="_blank" rel="noopener" class="message-file">
                  <FileText :size="20" />
                  <span class="message-file-info">
                    <span class="message-file-name">{{ m.media?.originalName }}</span>
                    <span class="message-file-size">{{ formatSize(m.media?.size) }}</span>
                  </span>
                </a>

                <a v-else-if="m.type === 'location'" :href="mapsLink(m.location)" target="_blank" rel="noopener" class="message-location">
                  <MapDisplay class="message-location-map" :lat="m.location.lat" :lng="m.location.lng" />
                  <span class="message-location-link"><MapPin :size="14" /> {{ t('chat.attach.openMaps') }}</span>
                </a>
              </template>

              <span class="message-meta">
                <span v-if="m.editedAt && !m.deleted" class="message-edited">{{ t('chat.edited') }}</span>
                {{ formatTime(m.createdAt) }}
                <template v-if="m.sender?._id === auth.user?._id">
                  <Check v-if="!m.readAt" :size="14" class="tick" />
                  <CheckCheck v-else :size="14" class="tick tick-read" />
                </template>
              </span>
            </div>

            <div v-if="!m.deleted && m.sender?._id === auth.user?._id" class="message-actions">
              <button v-if="m.type === 'text'" class="message-action-btn" :title="t('chat.edit')" @click="startEdit(m)">
                <Pencil :size="13" />
              </button>
              <button class="message-action-btn" :title="t('chat.delete')" @click="removeMessage(m._id)">
                <Trash2 :size="13" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="editingId" class="editing-banner">
          <Pencil :size="14" /> {{ t('chat.editing') }}
          <button class="icon-btn icon-btn-sm" type="button" @click="cancelEdit"><X :size="14" /></button>
        </div>

        <div class="message-input-row" ref="attachWrapper">
          <div v-if="!editingId" class="attach-wrap">
            <button class="icon-btn" type="button" :title="t('chat.attach.label')" @click="attachMenuOpen = !attachMenuOpen">
              <Paperclip :size="18" />
            </button>
            <div v-if="attachMenuOpen" class="attach-menu">
              <button type="button" @click="triggerMediaInput">{{ t('chat.attach.media') }}</button>
              <button type="button" @click="triggerFileInput">{{ t('chat.attach.file') }}</button>
              <button type="button" @click="shareLocation">{{ t('chat.attach.location') }}</button>
            </div>
            <input ref="mediaInputEl" type="file" accept="image/*,video/*" class="hidden-input" @change="onFileChosen" />
            <input ref="fileInputEl" type="file" class="hidden-input" @change="onFileChosen" />
          </div>

          <template v-if="recording">
            <div class="recording-indicator"><span class="rec-dot"></span> {{ formatElapsed(elapsedSeconds) }}</div>
            <button class="btn btn-ghost btn-sm" type="button" @click="cancelVoice">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary btn-sm" type="button" @click="stopAndSendVoice">{{ t('chat.send') }}</button>
          </template>
          <template v-else>
            <input
              v-model="draft"
              type="text"
              :placeholder="t('chat.messagePlaceholder')"
              @keydown.enter="send"
            />
            <button v-if="draft.trim() || editingId" class="btn btn-primary btn-sm" type="button" :disabled="!draft.trim()" @click="send">{{ t('chat.send') }}</button>
            <button v-else class="icon-btn" type="button" :title="t('chat.attach.voice')" @click="startVoice">
              <Mic :size="18" />
            </button>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import { useRoute, useRouter, RouterLink } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { MessagesSquare, AlertTriangle, Users, Paperclip, Mic, MapPin, FileText, Check, CheckCheck, Pencil, Trash2, Ban, X } from 'lucide-vue-next'
  import { useChatStore } from '../stores/chat.js'
  import { useFriendStore } from '../stores/friends.js'
  import { useUserStore } from '../stores/users.js'
  import { useAuthStore } from '../stores/auth.js'
  import { useDebouncedFn } from '../composables/useDebouncedFn.js'
  import { useToast } from '../composables/useToast.js'
  import { useVoiceRecorder } from '../composables/useVoiceRecorder.js'
  import MapDisplay from '../components/MapDisplay.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const chatStore = useChatStore()
  const friendStore = useFriendStore()
  const userStore = useUserStore()
  const auth = useAuthStore()
  const { toast } = useToast()

  const draft = ref('')
  const scrollEl = ref(null)
  const threadError = ref('')
  const editingId = ref(null)
  let pollTimer = null

  function startEdit(m) {
    editingId.value = m._id
    draft.value = m.body || ''
  }

  function cancelEdit() {
    editingId.value = null
    draft.value = ''
  }

  async function removeMessage(messageId) {
    if (!window.confirm(t('chat.confirmDelete'))) return
    await chatStore.deleteMessage(messageId)
  }

  // Allegati: menu "+" (media/file/posizione) e registrazione vocale
  const attachMenuOpen = ref(false)
  const attachWrapper = ref(null)
  const mediaInputEl = ref(null)
  const fileInputEl = ref(null)
  const { recording, elapsedSeconds, start: startRecording, stop: stopRecording, cancel: cancelRecording } = useVoiceRecorder()

  function closeAttachMenuOnOutsideClick(event) {
    if (attachMenuOpen.value && attachWrapper.value && !attachWrapper.value.contains(event.target)) {
      attachMenuOpen.value = false
    }
  }

  function triggerMediaInput() { attachMenuOpen.value = false; mediaInputEl.value?.click() }
  function triggerFileInput() { attachMenuOpen.value = false; fileInputEl.value?.click() }

  async function onFileChosen(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await chatStore.sendMedia(route.params.userId, file)
    await scrollToBottom()
  }

  function shareLocation() {
    attachMenuOpen.value = false
    if (!navigator.geolocation) { toast(t('chat.attach.locationUnsupported'), { type: 'danger' }); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await chatStore.sendLocation(route.params.userId, { lat: pos.coords.latitude, lng: pos.coords.longitude })
        await scrollToBottom()
      },
      () => toast(t('chat.attach.locationDenied'), { type: 'danger' })
    )
  }

  async function startVoice() {
    try {
      await startRecording()
    } catch (e) {
      const key = e?.name === 'NotAllowedError' ? 'chat.attach.micDenied' : 'chat.attach.micUnsupported'
      toast(t(key), { type: 'danger' })
    }
  }

  async function stopAndSendVoice() {
    const blob = await stopRecording()
    if (!blob) { toast(t('chat.attach.voiceEmpty'), { type: 'danger' }); return }
    // L'estensione riflette il mimetype reale negoziato dal browser (webm su
    // Chrome/Firefox, mp4 su Safari): forzarla a .webm su file non-webm rende
    // il file illeggibile ai player (durata 0 / errore di riproduzione).
    const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'
    const file = new File([blob], `vocale-${Date.now()}.${ext}`, { type: blob.type })
    await chatStore.sendMedia(route.params.userId, file)
    await scrollToBottom()
  }

  function cancelVoice() { cancelRecording() }

  function formatElapsed(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatSize(bytes) {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let n = bytes, i = 0
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(i > 0 && n < 10 ? 1 : 0)} ${units[i]}`
  }

  function mapsLink(loc) {
    return `https://maps.google.com/?q=${loc.lat},${loc.lng}`
  }

  function previewText(lastMessage) {
    if (!lastMessage) return ''
    switch (lastMessage.type) {
      case 'image': return '📷 Foto'
      case 'video': return '🎥 Video'
      case 'audio': return '🎤 Messaggio vocale'
      case 'location': return '📍 Posizione'
      case 'file': return `📎 ${lastMessage.media?.originalName || 'File'}`
      default: return lastMessage.body
    }
  }

  // ricerca amici per inviare richiesta direttamente dal pannello chat
  const query = ref('')
  const requestStatus = reactive({})

  function statusFor(userId) {
    if (requestStatus[userId] && requestStatus[userId] !== 'sending') return requestStatus[userId]
    if (friendStore.friends.some(f => f._id === userId)) return 'friends'
    if (friendStore.sent.some(r => r.recipient._id === userId)) return 'sent'
    if (friendStore.received.some(r => r.requester._id === userId)) return 'received'
    return requestStatus[userId] === 'sending' ? 'sending' : null
  }

  const runSearch = useDebouncedFn(async (q) => { await userStore.searchUsers(q) }, 350)

  function onSearch() {
    const q = query.value.trim()
    if (q.length < 2) { userStore.results = []; return }
    runSearch(q)
  }

  async function sendRequest(u) {
    requestStatus[u._id] = 'sending'
    const ok = await friendStore.sendRequest(u._id)
    if (ok) {
      requestStatus[u._id] = 'sent'
      await friendStore.fetchRequests()
    } else {
      delete requestStatus[u._id]
      toast(friendStore.error, { type: 'danger' })
    }
  }

  const friend = computed(() => friendStore.friends.find(f => f._id === route.params.userId))

  function initials(u) {
    const name = u?.displayName || u?.email || '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  function goToThread(userId) {
    router.push(`/chat/${userId}`)
  }

  async function scrollToBottom() {
    await nextTick()
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  }

  async function loadThread(userId) {
    threadError.value = ''
    try {
      const conversationId = await chatStore.openConversationWith(userId)
      await chatStore.fetchMessages(conversationId)
      await chatStore.markRead(conversationId)
      await chatStore.fetchUnreadCount()
      await scrollToBottom()
      clearInterval(pollTimer)
      pollTimer = setInterval(async () => {
        const before = chatStore.messages.length
        await chatStore.fetchMessages(conversationId)
        if (chatStore.messages.length > before) {
          await chatStore.markRead(conversationId)
          await chatStore.fetchUnreadCount()
          await scrollToBottom()
        }
      }, 4000)
    } catch (e) {
      threadError.value = e.response?.data?.error || t('common.error')
    }
  }

  async function send() {
    const body = draft.value.trim()
    if (!body) return
    draft.value = ''
    if (editingId.value) {
      const id = editingId.value
      editingId.value = null
      await chatStore.editMessage(id, body)
      return
    }
    await chatStore.sendMessage(route.params.userId, body)
    await scrollToBottom()
  }

  watch(() => route.params.userId, (userId) => {
    clearInterval(pollTimer)
    chatStore.messages = []
    editingId.value = null
    if (userId) loadThread(userId)
    else chatStore.fetchConversations()
  }, { immediate: true })

  onMounted(() => {
    friendStore.fetchFriends()
    friendStore.fetchRequests()
    chatStore.fetchConversations()
    document.addEventListener('click', closeAttachMenuOnOutsideClick)
  })

  onBeforeUnmount(() => {
    clearInterval(pollTimer)
    document.removeEventListener('click', closeAttachMenuOnOutsideClick)
  })
</script>

<style scoped>
  .page-header {
    @apply flex items-center justify-between gap-4 mb-4;
  }

  .chat-thread-header {
    @apply border-b border-border pb-4 justify-start;
  }

  .chat-header-info {
    @apply flex items-center gap-2.5 no-underline text-inherit min-w-0;
  }

  .chat-header-text {
    @apply flex flex-col min-w-0;
  }

  .chat-header-name {
    @apply font-semibold text-foam truncate;
  }

  .chat-header-email {
    @apply text-xs text-muted truncate;
  }

  .error-banner {
    @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4 inline-flex items-center gap-2;
  }

  .chat-search {
    @apply flex-1;
  }

  .search-results {
    @apply flex flex-col gap-1;
  }

  .search-result-row {
    @apply flex items-center gap-2 px-2 py-2.5 rounded-sm;
  }
  .search-result-row .btn, .search-result-row .badge { @apply shrink-0 whitespace-nowrap; }

  .search-result-clickable {
    @apply bg-transparent border-none text-left w-full cursor-pointer hover:bg-surface-2 transition-colors;
  }

  .no-results {
    @apply text-muted text-sm py-2;
  }

  .member-info {
    @apply flex items-center gap-2 text-sm text-foam no-underline min-w-0 flex-1;
  }
  .member-name { @apply truncate flex-1 min-w-0; }

  .conversations-list {
    @apply flex flex-col gap-1;
  }

  .conversation-row {
    @apply flex items-center gap-3 bg-transparent border-none text-left w-full px-2 py-2.5 rounded-sm cursor-pointer hover:bg-surface-2 transition-colors;
  }

  .conversation-info {
    @apply flex flex-col min-w-0 flex-1;
  }

  .conversation-name {
    @apply text-sm font-semibold text-foam truncate;
  }

  .conversation-preview {
    @apply text-xs text-muted truncate;
  }

  .mini-avatar {
    @apply w-9 h-9 rounded-full object-cover shrink-0;
  }

  .mini-placeholder {
    @apply w-9 h-9 rounded-full border border-ocean text-ocean flex items-center justify-center text-xs font-bold shrink-0;
    background: var(--ocean-glow);
  }

  .chat-fullheight {
    @apply flex flex-col flex-1 min-h-0;
  }

  .chat-fullheight .chat-thread-header {
    @apply shrink-0;
  }

  .chat-fullheight .error-banner {
    @apply shrink-0;
  }

  .chat-fullheight .thread {
    @apply flex-1 min-h-0;
  }

  .thread {
    @apply flex flex-col gap-3;
  }

  .messages-list {
    @apply flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1;
  }

  .message-row {
    @apply flex items-end gap-1;
  }

  .message-row.mine {
    @apply justify-end flex-row-reverse;
  }

  .message-bubble {
    @apply max-w-[75%] min-w-[4.5rem] flex flex-col gap-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foam;
  }

  .message-row.mine .message-bubble {
    @apply bg-ocean border-ocean text-white;
  }

  .message-text {
    @apply whitespace-pre-wrap;
  }

  .message-bubble.deleted {
    @apply opacity-70 italic;
  }

  .message-deleted-text {
    @apply flex items-center gap-1.5 text-muted;
  }

  .message-row.mine .message-deleted-text {
    @apply text-white/70;
  }

  .message-meta {
    @apply self-end flex items-center gap-1 text-[0.65rem] opacity-90 mt-0.5 whitespace-nowrap;
  }

  .message-edited {
    @apply italic opacity-80;
  }

  .tick {
    @apply opacity-90;
  }

  .tick-read {
    @apply text-sky-300 opacity-100;
  }

  .message-actions {
    @apply flex flex-col gap-0.5 opacity-0 transition-opacity duration-150;
  }

  .message-row:hover .message-actions {
    @apply opacity-100;
  }

  .message-action-btn {
    @apply flex items-center justify-center w-6 h-6 rounded text-muted bg-transparent border-none cursor-pointer hover:bg-surface-2 hover:text-ocean transition-colors;
  }

  .message-media-image {
    @apply max-w-full rounded-sm max-h-72 object-cover cursor-pointer;
  }

  .message-media-video {
    @apply max-w-full rounded-sm max-h-72;
  }

  .message-audio {
    @apply max-w-full;
  }

  .message-file {
    @apply flex items-center gap-2 no-underline text-inherit bg-black/10 rounded-sm px-2 py-1.5;
  }

  .message-file-info {
    @apply flex flex-col min-w-0;
  }

  .message-file-name {
    @apply text-sm font-medium truncate max-w-[180px];
  }

  .message-file-size {
    @apply text-xs opacity-70;
  }

  .message-location {
    @apply flex flex-col gap-1 no-underline text-inherit;
  }

  .message-location-map :deep(.map-display) {
    height: 140px;
    width: 220px;
  }

  .message-location-link {
    @apply flex items-center gap-1 text-xs;
  }

  .editing-banner {
    @apply flex items-center gap-2 text-xs text-ocean bg-ocean/10 border-l-2 border-ocean px-3 py-1.5 rounded-sm;
  }

  .editing-banner .icon-btn-sm {
    @apply ml-auto;
  }

  .message-input-row {
    @apply flex items-center gap-2 border-t border-border pt-3 relative;
  }

  .message-input-row input {
    @apply text-sm flex-1;
  }

  .icon-btn {
    @apply flex items-center justify-center w-9 h-9 rounded-lg text-muted bg-transparent border-none cursor-pointer hover:bg-surface-2 hover:text-ocean transition-colors shrink-0;
  }

  .icon-btn-sm {
    @apply w-6 h-6;
  }

  .hidden-input {
    @apply hidden;
  }

  .attach-wrap {
    @apply relative;
  }

  .attach-menu {
    @apply absolute bottom-11 left-0 flex flex-col gap-0.5 bg-surface border border-border rounded-lg p-1 z-10 min-w-[160px] shadow-lg;
  }

  .attach-menu button {
    @apply text-left text-sm px-3 py-2 rounded bg-transparent border-none text-foam cursor-pointer hover:bg-surface-2 transition-colors;
  }

  .recording-indicator {
    @apply flex items-center gap-2 text-sm text-danger flex-1;
  }

  .rec-dot {
    @apply w-2.5 h-2.5 rounded-full bg-danger animate-pulse;
  }
</style>
