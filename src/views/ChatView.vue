<template>
  <div>
    <!-- Lista conversazioni -->
    <template v-if="!route.params.userId">
      <div class="page-header">
        <h2>{{ t('chat.titlePrefix') }} <span class="text-ocean">{{ t('chat.titleHighlight') }}</span></h2>
        <RouterLink to="/friends" class="btn btn-ghost btn-sm">
          <Users :size="16" /> {{ t('chat.friendsLink') }}
        </RouterLink>
      </div>

      <!-- Aggiungi un amico: ricerca utenti e invio richiesta -->
      <div class="card search-card">
        <label>{{ t('chat.addFriend.label') }}</label>
        <input v-model="query" type="text" :placeholder="t('chat.addFriend.placeholder')" @input="onSearch" />
        <ul v-if="query.trim().length >= 2" class="search-results">
          <li v-for="u in userStore.results" :key="u._id" class="search-result-row">
            <RouterLink :to="`/users/${u._id}`" class="member-info">
              <img v-if="u.avatar" :src="u.avatar" class="mini-avatar" />
              <span v-else class="mini-placeholder">{{ initials(u) }}</span>
              <span>{{ u.displayName || u.email }}</span>
            </RouterLink>
            <button
              class="btn btn-secondary btn-sm"
              :disabled="requestStatus[u._id] === 'sending'"
              v-if="!statusFor(u._id)"
              @click="sendRequest(u)"
            >{{ t('friends.actions.add') }}</button>
            <span v-else class="badge badge-ocean">{{ t(`friends.status.${statusFor(u._id)}`) }}</span>
          </li>
          <li v-if="!userStore.loading && !userStore.results.length" class="no-results">{{ t('chat.addFriend.noResults') }}</li>
        </ul>
      </div>

      <!-- Nuova chat: amici senza conversazione ancora aperta -->
      <div v-if="startableFriends.length" class="card new-chat-card">
        <label>{{ t('chat.newChat.label') }}</label>
        <div class="friend-picker">
          <button v-for="f in startableFriends" :key="f._id" class="friend-chip" @click="goToThread(f._id)">
            <img v-if="f.avatar" :src="f.avatar" class="mini-avatar" />
            <span v-else class="mini-placeholder">{{ initials(f) }}</span>
            {{ f.displayName || f.email }}
          </button>
        </div>
      </div>
      <div v-else-if="!friendStore.friends.length" class="card new-chat-card">
        <label>{{ t('chat.newChat.label') }}</label>
        <p class="text-muted mt-1">{{ t('chat.newChat.noFriends') }}</p>
      </div>

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
            <span class="conversation-preview">{{ c.lastMessage?.body }}</span>
          </div>
          <span v-if="c.unreadCount" class="badge badge-ocean">{{ c.unreadCount }}</span>
        </button>
      </div>
    </template>

    <!-- Thread con un amico -->
    <template v-else>
      <div class="page-header">
        <RouterLink to="/chat" class="btn btn-ghost btn-sm">{{ t('common.back') }}</RouterLink>
        <h2>{{ friend?.displayName || friend?.email || '...' }}</h2>
      </div>

      <div v-if="threadError" class="error-banner"><AlertTriangle :size="16" /> {{ threadError }}</div>

      <div v-else class="thread card">
        <div ref="scrollEl" class="messages-list">
          <div v-if="chatStore.loading && !chatStore.messages.length" class="state-center"><div class="spinner"></div></div>
          <div
            v-for="m in chatStore.messages"
            :key="m._id"
            class="message-row"
            :class="{ mine: m.sender?._id === auth.user?._id }"
          >
            <span class="message-bubble">{{ m.body }}</span>
          </div>
        </div>

        <div class="message-input-row">
          <input
            v-model="draft"
            type="text"
            :placeholder="t('chat.messagePlaceholder')"
            @keydown.enter="send"
          />
          <button class="btn btn-primary btn-sm" :disabled="!draft.trim()" @click="send">{{ t('chat.send') }}</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MessagesSquare, AlertTriangle, Users } from 'lucide-vue-next'
import { useChatStore } from '../stores/chat.js'
import { useFriendStore } from '../stores/friends.js'
import { useUserStore } from '../stores/users.js'
import { useAuthStore } from '../stores/auth.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'
import { useToast } from '../composables/useToast.js'

const { t } = useI18n()
const route  = useRoute()
const router = useRouter()
const chatStore   = useChatStore()
const friendStore = useFriendStore()
const userStore   = useUserStore()
const auth        = useAuthStore()
const { toast }   = useToast()

const draft       = ref('')
const scrollEl     = ref(null)
const threadError  = ref('')
let pollTimer = null

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

// Amici con cui non è ancora stata scambiata nessuna conversazione: solo
// quelli compaiono nel "nuova chat", gli altri sono già nella lista sotto.
const startableFriends = computed(() => {
  const withThread = new Set(chatStore.conversations.map(c => c.user._id))
  return friendStore.friends.filter(f => !withThread.has(f._id))
})

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
  await chatStore.sendMessage(route.params.userId, body)
  await scrollToBottom()
}

watch(() => route.params.userId, (userId) => {
  clearInterval(pollTimer)
  chatStore.messages = []
  if (userId) loadThread(userId)
  else chatStore.fetchConversations()
}, { immediate: true })

onMounted(() => {
  friendStore.fetchFriends()
  friendStore.fetchRequests()
  chatStore.fetchConversations()
})

onBeforeUnmount(() => clearInterval(pollTimer))
</script>

<style scoped>
.page-header { @apply flex items-center justify-between gap-4 mb-6; }
.error-banner { @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4 inline-flex items-center gap-2; }

.search-card  { @apply mb-4 relative; }
.search-results {
  @apply flex flex-col gap-1 mt-2 max-h-64 overflow-y-auto;
}
.search-result-row { @apply flex items-center justify-between gap-2 py-1.5; }
.no-results { @apply text-muted text-sm py-2; }
.member-info { @apply flex items-center gap-2 text-sm text-foam no-underline; }

.new-chat-card { @apply mb-4; }
.friend-picker { @apply flex flex-wrap gap-2 mt-2; }
.friend-chip {
  @apply flex items-center gap-2 bg-surface-2 border border-border rounded-full
         text-sm text-foam px-3 py-1.5 cursor-pointer hover:border-ocean transition-colors;
}

.conversations-list { @apply flex flex-col gap-1; }
.conversation-row {
  @apply flex items-center gap-3 bg-transparent border-none text-left w-full
         px-2 py-2.5 rounded-sm cursor-pointer hover:bg-surface-2 transition-colors;
}
.conversation-info  { @apply flex flex-col min-w-0 flex-1; }
.conversation-name   { @apply text-sm font-semibold text-foam; }
.conversation-preview { @apply text-xs text-muted truncate; }

.mini-avatar { @apply w-9 h-9 rounded-full object-cover shrink-0; }
.mini-placeholder {
  @apply w-9 h-9 rounded-full border border-ocean text-ocean flex items-center
         justify-center text-xs font-bold shrink-0;
  background: var(--ocean-glow);
}

.thread { @apply flex flex-col gap-3 h-[65vh]; }
.messages-list { @apply flex-1 overflow-y-auto flex flex-col gap-2 pr-1; }

.message-row { @apply flex; }
.message-row.mine { @apply justify-end; }
.message-bubble {
  @apply max-w-[75%] bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foam whitespace-pre-wrap;
}
.message-row.mine .message-bubble { @apply bg-ocean border-ocean text-white; }

.message-input-row { @apply flex gap-2 border-t border-border pt-3; }
.message-input-row input { @apply text-sm flex-1; }
</style>
