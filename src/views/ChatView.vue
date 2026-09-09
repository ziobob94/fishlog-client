<template>
  <div :class="{ 'chat-fullheight': route.params.userId }">
    <!-- Lista conversazioni -->
    <template v-if="!route.params.userId">
      <div class="page-header">
        <div class="chat-search-wrap">
          <Search :size="16" class="chat-search-icon" />
          <input
            v-model="query" type="text" class="chat-search"
            :placeholder="t('chat.search.placeholder')" @input="onSearch"
          />
        </div>
        <RouterLink to="/chat/group/new" class="icon-btn shrink-0" :title="t('chat.group.newTitle')">
          <UsersRound :size="18" />
        </RouterLink>
        <RouterLink to="/friends" class="icon-btn shrink-0" :title="t('chat.friendsLink')">
          <Users :size="18" />
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
        <div v-if="chatStore.conversations.length" class="tabs" role="tablist">
          <button
            type="button" role="tab" :aria-selected="filterMode === 'all'"
            class="tab-pill" :class="{ active: filterMode === 'all' }" @click="filterMode = 'all'"
          >{{ t('chat.filters.all') }}</button>
          <button
            type="button" role="tab" :aria-selected="filterMode === 'unread'"
            class="tab-pill" :class="{ active: filterMode === 'unread' }" @click="filterMode = 'unread'"
          >{{ t('chat.filters.unread') }}<span v-if="unreadConversationsCount"> {{ unreadConversationsCount }}</span></button>
          <button
            type="button" role="tab" :aria-selected="filterMode === 'favorites'"
            class="tab-pill" :class="{ active: filterMode === 'favorites' }" @click="filterMode = 'favorites'"
          >{{ t('chat.filters.favorites') }}<span v-if="favoriteConversationsCount"> {{ favoriteConversationsCount }}</span></button>
          <button
            type="button" role="tab" :aria-selected="filterMode === 'groups'"
            class="tab-pill" :class="{ active: filterMode === 'groups' }" @click="filterMode = 'groups'"
          >{{ t('chat.filters.groups') }}<span v-if="groupConversationsCount"> {{ groupConversationsCount }}</span></button>
        </div>

        <div v-if="chatStore.loading" class="state-center"><div class="spinner"></div></div>

        <div v-else-if="!chatStore.conversations.length" class="state-center">
          <div style="font-size:3rem; display:flex; justify-content:center"><MessagesSquare :size="48" /></div>
          <p class="text-muted mt-1">{{ t('chat.empty') }}</p>
        </div>

        <div v-else-if="!visibleConversations.length" class="state-center">
          <p class="text-muted">{{ t(emptyFilterKey) }}</p>
        </div>

        <div v-else class="conversations-list">
          <div
            v-for="c in visibleConversations" :key="c._id" class="conversation-row"
            role="button" tabindex="0"
            @click="goToConversation(c)" @keydown.enter="goToConversation(c)"
          >
            <template v-if="c.type === 'group'">
              <span class="conversation-avatar-placeholder group-avatar"><UsersRound :size="22" /></span>
            </template>
            <template v-else>
              <img v-if="c.user?.avatar" :src="c.user.avatar" class="conversation-avatar" />
              <span v-else class="conversation-avatar-placeholder">{{ initials(c.user) }}</span>
            </template>
            <div class="conversation-body">
              <div class="conversation-info">
                <span class="conversation-name" :class="{ unread: c.unreadCount }">
                  {{ c.type === 'group' ? c.name : (c.user?.displayName || c.user?.email) }}
                </span>
                <span class="conversation-preview" :class="{ unread: c.unreadCount }">
                  <CheckCheck v-if="messageTick(c) === 'read'" :size="14" class="tick tick-read shrink-0" />
                  <Check v-else-if="messageTick(c) === 'sent'" :size="14" class="tick shrink-0" />
                  <span class="conversation-preview-text">{{ previewText(c) }}</span>
                </span>
              </div>
              <div class="conversation-meta">
                <button
                  type="button" class="conversation-favorite" :class="{ active: c.favorite }"
                  :title="t(c.favorite ? 'chat.unfavorite' : 'chat.favorite')"
                  @click.stop="toggleFavorite(c)"
                ><Star :size="15" :fill="c.favorite ? 'currentColor' : 'none'" /></button>
                <span class="conversation-time">{{ formatRelativeTime(c.lastMessageAt) }}</span>
                <span v-if="c.unreadCount" class="badge badge-ocean conversation-badge">{{ c.unreadCount }}</span>
              </div>
            </div>
          </div>
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
      <div v-else-if="!conversationId" class="state-center"><div class="spinner"></div></div>
      <ChatThread v-else :conversation-id="conversationId" />
    </template>
  </div>
</template>

<script setup>
  import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
  import { useRoute, useRouter, RouterLink } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { MessagesSquare, AlertTriangle, Users, UsersRound, Search, Star, Check, CheckCheck } from 'lucide-vue-next'
  import { useChatStore } from '../stores/chat.js'
  import { useFriendStore } from '../stores/friends.js'
  import { useUserStore } from '../stores/users.js'
  import { useAuthStore } from '../stores/auth.js'
  import { useDebouncedFn } from '../composables/useDebouncedFn.js'
  import { useToast } from '../composables/useToast.js'
  import ChatThread from '../components/chat/ChatThread.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const chatStore = useChatStore()
  const friendStore = useFriendStore()
  const userStore = useUserStore()
  const auth = useAuthStore()
  const { toast } = useToast()

  const threadError = ref('')
  const conversationId = ref(null)

  // filtri "Tutte / Da leggere / Preferiti / Gruppi" sopra la lista conversazioni
  const filterMode = ref('all')
  const unreadConversationsCount = computed(() => chatStore.conversations.filter(c => c.unreadCount).length)
  const favoriteConversationsCount = computed(() => chatStore.conversations.filter(c => c.favorite).length)
  const groupConversationsCount = computed(() => chatStore.conversations.filter(c => c.type === 'group').length)
  const visibleConversations = computed(() => {
    if (filterMode.value === 'unread') return chatStore.conversations.filter(c => c.unreadCount)
    if (filterMode.value === 'favorites') return chatStore.conversations.filter(c => c.favorite)
    if (filterMode.value === 'groups') return chatStore.conversations.filter(c => c.type === 'group')
    return chatStore.conversations
  })
  const emptyFilterKey = computed(() => {
    if (filterMode.value === 'favorites') return 'chat.filters.noneFavorites'
    if (filterMode.value === 'groups') return 'chat.filters.noneGroups'
    return 'chat.filters.noneUnread'
  })

  function formatRelativeTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
    const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000)

    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return t('chat.yesterday')
    if (diffDays < 7) return d.toLocaleDateString('it-IT', { weekday: 'short' })
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
  }

  // Spunta di stato solo sull'ultimo messaggio della conversazione, e solo
  // se l'ho mandato io: "letto" (doppia, blu) o "inviato" (singola). In un
  // gruppo readBy conta solo chi tra gli altri l'ha già letto.
  function messageTick(c) {
    const msg = c.lastMessage
    if (!msg || msg.deleted) return null
    const senderId = msg.sender?._id || msg.sender
    if (String(senderId) !== String(auth.user?._id)) return null
    return msg.readBy?.length ? 'read' : 'sent'
  }

  function previewText(c) {
    const lastMessage = c.lastMessage
    if (!lastMessage) return ''
    if (lastMessage.deleted) return t('chat.deletedMessage')

    const text = (() => {
      switch (lastMessage.type) {
        case 'image': return '📷 Foto'
        case 'video': return '🎥 Video'
        case 'audio': return '🎤 Messaggio vocale'
        case 'location': return '📍 Posizione'
        case 'file': return `📎 ${lastMessage.media?.originalName || 'File'}`
        default: return lastMessage.body
      }
    })()

    if (c.type !== 'group') return text
    const senderId = lastMessage.sender?._id || lastMessage.sender
    const senderName = String(senderId) === String(auth.user?._id)
      ? t('chat.group.you')
      : (lastMessage.sender?.displayName || lastMessage.sender?.email || '').split(' ')[0]
    return senderName ? `${senderName}: ${text}` : text
  }

  async function toggleFavorite(c) {
    const next = !c.favorite
    c.favorite = next // ottimistico: la stella risponde subito al tocco
    try {
      await chatStore.toggleFavorite(c._id, next)
    } catch {
      c.favorite = !next
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

  function goToConversation(c) {
    if (c.type === 'group') router.push(`/chat/group/${c._id}`)
    else goToThread(c.user._id)
  }

  async function resolveDirectConversation(userId) {
    threadError.value = ''
    conversationId.value = null
    try {
      conversationId.value = await chatStore.openConversationWith(userId)
    } catch (e) {
      threadError.value = e.response?.data?.error || t('common.error')
    }
  }

  watch(() => route.params.userId, (userId) => {
    if (userId) resolveDirectConversation(userId)
    else chatStore.fetchConversations()
  }, { immediate: true })

  onMounted(() => {
    friendStore.fetchFriends()
    friendStore.fetchRequests()
    chatStore.fetchConversations()
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

  .chat-search-wrap {
    @apply relative flex-1;
  }

  .chat-search-icon {
    @apply absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none;
  }

  .chat-search {
    @apply w-full rounded-full bg-surface-2 border-none pl-9 pr-4 py-2 text-sm;
  }

  .tabs {
    @apply flex gap-1 p-1 mb-3 bg-surface-2 rounded-full;
  }
  .tab-pill {
    @apply inline-flex items-center gap-1 text-xs font-semibold text-muted bg-transparent border-none rounded-full cursor-pointer px-3 py-1.5 transition-colors;
  }
  .tab-pill:hover { @apply text-foam; }
  .tab-pill.active { @apply text-ink bg-ocean; }

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
    @apply flex flex-col;
  }

  .conversation-row {
    @apply flex items-center gap-3 px-2 rounded-sm cursor-pointer hover:bg-surface-2 transition-colors;
  }
  .conversation-row:focus-visible {
    @apply outline-none ring-2 ring-ocean;
  }

  /* Il divisore parte dopo l'avatar (come nelle app di messaggistica più
     comuni): sta sul contenuto, non sulla riga intera, e sparisce sull'ultima. */
  .conversation-body {
    @apply flex items-center gap-3 flex-1 min-w-0 border-b border-border py-2.5;
  }
  .conversation-row:last-child .conversation-body {
    @apply border-b-0;
  }

  .conversation-info {
    @apply flex flex-col min-w-0 flex-1;
  }

  .conversation-name {
    @apply text-sm font-medium text-foam truncate;
  }
  .conversation-name.unread {
    @apply font-bold;
  }

  .conversation-preview {
    @apply flex items-center gap-1 text-xs text-muted min-w-0;
  }
  .conversation-preview.unread {
    @apply text-foam font-medium;
  }
  .conversation-preview-text {
    @apply truncate min-w-0;
  }

  .conversation-meta {
    @apply flex flex-col items-end gap-1 shrink-0 self-stretch;
  }

  .conversation-favorite {
    @apply flex items-center justify-center w-5 h-5 text-muted bg-transparent border-none cursor-pointer p-0 hover:text-sand transition-colors;
  }
  .conversation-favorite.active {
    @apply text-sand;
  }

  .conversation-time {
    @apply text-[0.7rem] text-muted;
  }

  .conversation-badge {
    @apply mt-auto;
  }

  .conversation-avatar {
    @apply w-14 h-14 rounded-full object-cover shrink-0 my-2.5;
  }

  .conversation-avatar-placeholder {
    @apply w-14 h-14 rounded-full border border-ocean text-ocean flex items-center justify-center text-base font-bold shrink-0 my-2.5;
    background: var(--ocean-glow);
  }

  .group-avatar {
    @apply text-sand border-sand;
    background: rgb(var(--color-sand) / 0.15);
  }

  .mini-avatar {
    @apply w-9 h-9 rounded-full object-cover shrink-0;
  }

  .mini-placeholder {
    @apply w-9 h-9 rounded-full border border-ocean text-ocean flex items-center justify-center text-xs font-bold shrink-0;
    background: var(--ocean-glow);
  }

  .icon-btn {
    @apply flex items-center justify-center w-9 h-9 rounded-lg text-muted bg-transparent border-none cursor-pointer hover:bg-surface-2 hover:text-ocean transition-colors shrink-0;
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
</style>
