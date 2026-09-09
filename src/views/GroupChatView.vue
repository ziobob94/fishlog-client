<template>
  <div class="chat-fullheight">
    <div class="page-header chat-thread-header pt-4">
      <RouterLink to="/chat" class="btn btn-ghost btn-sm">{{ t('chat.group.back') }}</RouterLink>
      <button v-if="group" type="button" class="chat-header-info" @click="manageOpen = !manageOpen">
        <span class="conversation-avatar-placeholder group-avatar"><UsersRound :size="20" /></span>
        <span class="chat-header-text">
          <span class="chat-header-name">{{ group.name }}</span>
          <span class="chat-header-email">{{ t('chat.group.membersCount', { n: group.members?.length || 0 }) }}</span>
        </span>
      </button>
      <h2 v-else>...</h2>
      <button v-if="group" type="button" class="icon-btn ml-auto" :title="t('chat.group.manageMembers')" @click="manageOpen = !manageOpen">
        <Settings :size="18" />
      </button>
    </div>

    <div v-if="loadError" class="error-banner"><AlertTriangle :size="16" /> {{ loadError }}</div>

    <template v-else-if="group">
      <div v-if="manageOpen" class="manage-panel card">
        <div v-if="group.isOwner" class="rename-row">
          <input v-model="renameValue" type="text" :placeholder="t('chat.group.renamePlaceholder')" maxlength="60" />
          <button type="button" class="btn btn-secondary btn-sm" :disabled="!renameValue.trim() || renaming" @click="rename">
            {{ t('chat.group.save') }}
          </button>
        </div>

        <div class="members-list">
          <div v-for="m in group.members" :key="m._id" class="member-row">
            <div class="member-info">
              <img v-if="m.avatar" :src="m.avatar" class="mini-avatar" />
              <span v-else class="mini-placeholder">{{ initials(m) }}</span>
              <span class="member-name">{{ m.displayName || m.email }}</span>
              <span v-if="m._id === group.owner" class="badge badge-sand shrink-0" style="font-size:.6rem">{{ t('chat.group.owner') }}</span>
            </div>
            <button
              v-if="group.isOwner && m._id !== auth.user?._id"
              class="btn btn-ghost btn-sm shrink-0" :title="t('chat.group.removeMember')"
              @click="removeMember(m)"
            ><X :size="14" /></button>
          </div>
        </div>

        <template v-if="group.isOwner && addableFriends.length">
          <label class="members-label">{{ t('chat.group.addMembers') }}</label>
          <div class="friends-list">
            <div v-for="f in addableFriends" :key="f._id" class="member-row">
              <div class="member-info">
                <img v-if="f.avatar" :src="f.avatar" class="mini-avatar" />
                <span v-else class="mini-placeholder">{{ initials(f) }}</span>
                <span class="member-name">{{ f.displayName || f.email }}</span>
              </div>
              <button class="btn btn-secondary btn-sm shrink-0" @click="addMember(f)">{{ t('chat.group.add') }}</button>
            </div>
          </div>
        </template>

        <button type="button" class="btn btn-ghost mt-2" @click="leave">{{ t('chat.group.leave') }}</button>
      </div>

      <ChatThread :conversation-id="conversationId" show-sender-names />
    </template>

    <div v-else class="state-center"><div class="spinner"></div></div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter, RouterLink } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { AlertTriangle, UsersRound, Settings, X } from 'lucide-vue-next'
  import { useChatStore } from '../stores/chat.js'
  import { useFriendStore } from '../stores/friends.js'
  import { useAuthStore } from '../stores/auth.js'
  import { useToast } from '../composables/useToast.js'
  import ChatThread from '../components/chat/ChatThread.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const chatStore = useChatStore()
  const friendStore = useFriendStore()
  const auth = useAuthStore()
  const { toast } = useToast()

  const conversationId = computed(() => route.params.conversationId)
  const group = ref(null)
  const loadError = ref('')
  const manageOpen = ref(false)
  const renameValue = ref('')
  const renaming = ref(false)

  const addableFriends = computed(() => {
    if (!group.value) return []
    const memberIds = new Set(group.value.members.map(m => m._id))
    return friendStore.friends.filter(f => !memberIds.has(f._id))
  })

  function initials(u) {
    const n = u?.displayName || u?.email || '?'
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  async function loadGroup() {
    loadError.value = ''
    group.value = null
    try {
      const data = await chatStore.fetchConversation(conversationId.value)
      if (data.type !== 'group') { loadError.value = t('chat.group.notFound'); return }
      group.value = data
      renameValue.value = data.name
    } catch (e) {
      loadError.value = e.response?.data?.error || t('chat.group.notFound')
    }
  }

  async function rename() {
    if (!renameValue.value.trim()) return
    renaming.value = true
    try {
      group.value.name = await chatStore.renameGroup(conversationId.value, renameValue.value.trim())
    } catch (e) {
      toast(e.response?.data?.error || t('common.error'), { type: 'danger' })
    } finally {
      renaming.value = false
    }
  }

  async function addMember(f) {
    try {
      await chatStore.addGroupMembers(conversationId.value, [f._id])
      await loadGroup()
    } catch (e) {
      toast(e.response?.data?.error || t('common.error'), { type: 'danger' })
    }
  }

  async function removeMember(m) {
    if (!window.confirm(t('chat.group.confirmRemoveMember'))) return
    try {
      await chatStore.removeGroupMember(conversationId.value, m._id)
      await loadGroup()
    } catch (e) {
      toast(e.response?.data?.error || t('common.error'), { type: 'danger' })
    }
  }

  async function leave() {
    if (!window.confirm(t('chat.group.confirmLeave'))) return
    try {
      await chatStore.removeGroupMember(conversationId.value, auth.user._id)
      router.push('/chat')
    } catch (e) {
      toast(e.response?.data?.error || t('common.error'), { type: 'danger' })
    }
  }

  onMounted(() => {
    loadGroup()
    friendStore.fetchFriends()
  })
</script>

<style scoped>
  .page-header {
    @apply flex items-center gap-4 mb-4;
  }

  .chat-thread-header {
    @apply border-b border-border pb-4 justify-start shrink-0;
  }

  .chat-header-info {
    @apply flex items-center gap-2.5 no-underline text-inherit min-w-0 bg-transparent border-none cursor-pointer text-left p-0;
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
    @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4 inline-flex items-center gap-2 shrink-0;
  }

  .icon-btn {
    @apply flex items-center justify-center w-9 h-9 rounded-lg text-muted bg-transparent border-none cursor-pointer hover:bg-surface-2 hover:text-ocean transition-colors shrink-0;
  }

  .conversation-avatar-placeholder {
    @apply w-10 h-10 rounded-full border border-ocean text-ocean flex items-center justify-center text-sm font-bold shrink-0;
    background: var(--ocean-glow);
  }

  .group-avatar {
    @apply text-sand border-sand;
    background: rgb(var(--color-sand) / 0.15);
  }

  .chat-fullheight {
    @apply flex flex-col flex-1 min-h-0;
  }

  .manage-panel {
    @apply flex flex-col gap-1.5 mb-3 shrink-0 max-h-64 overflow-y-auto;
  }

  .rename-row {
    @apply flex gap-2 mb-2;
  }
  .rename-row input {
    @apply flex-1 text-sm;
  }

  .members-label {
    @apply mt-2 text-sm font-medium text-foam;
  }

  .members-list, .friends-list {
    @apply flex flex-col gap-0.5;
  }

  .member-row {
    @apply flex items-center justify-between gap-2 py-1.5;
  }

  .member-info {
    @apply flex items-center gap-2 text-sm text-foam min-w-0 flex-1;
  }

  .member-name {
    @apply truncate flex-1 min-w-0;
  }

  .mini-avatar {
    @apply w-9 h-9 rounded-full object-cover shrink-0;
  }

  .mini-placeholder {
    @apply w-9 h-9 rounded-full border border-ocean text-ocean flex items-center justify-center text-xs font-bold shrink-0;
    background: var(--ocean-glow);
  }
</style>
