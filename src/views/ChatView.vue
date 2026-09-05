<template>
  <div>
    <!-- Lista conversazioni -->
    <template v-if="!route.params.userId">
      <div class="page-header">
        <h2>{{ t('chat.titlePrefix') }} <span class="text-ocean">{{ t('chat.titleHighlight') }}</span></h2>
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
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MessagesSquare, AlertTriangle } from 'lucide-vue-next'
import { useChatStore } from '../stores/chat.js'
import { useFriendStore } from '../stores/friends.js'
import { useAuthStore } from '../stores/auth.js'

const { t } = useI18n()
const route  = useRoute()
const router = useRouter()
const chatStore   = useChatStore()
const friendStore = useFriendStore()
const auth        = useAuthStore()

const draft       = ref('')
const scrollEl     = ref(null)
const threadError  = ref('')
let pollTimer = null

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
  chatStore.fetchConversations()
})

onBeforeUnmount(() => clearInterval(pollTimer))
</script>

<style scoped>
.page-header { @apply flex items-center gap-4 mb-6; }
.error-banner { @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4 inline-flex items-center gap-2; }

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
