<template>
  <div class="new-group">
    <div class="page-header">
      <RouterLink to="/chat" class="btn btn-ghost btn-sm">{{ t('chat.group.back') }}</RouterLink>
      <h2>{{ t('chat.group.newTitle') }}</h2>
    </div>

    <div class="card form-card">
      <label>{{ t('chat.group.nameLabel') }}</label>
      <input v-model="name" type="text" :placeholder="t('chat.group.namePlaceholder')" maxlength="60" />

      <label class="members-label">{{ t('chat.group.membersLabel') }}</label>
      <p v-if="!friendStore.friends.length" class="text-muted text-sm">{{ t('chat.group.noFriends') }}</p>
      <div v-else class="friends-list">
        <label v-for="f in friendStore.friends" :key="f._id" class="friend-check">
          <input type="checkbox" :value="f._id" v-model="selectedIds" />
          <img v-if="f.avatar" :src="f.avatar" class="mini-avatar" />
          <span v-else class="mini-placeholder">{{ initials(f) }}</span>
          <span class="member-name">{{ f.displayName || f.email }}</span>
        </label>
      </div>

      <p v-if="error" class="text-danger text-sm">{{ error }}</p>

      <button
        type="button" class="btn btn-primary mt-2"
        :disabled="creating" @click="submit"
      >{{ creating ? t('chat.group.creating') : t('chat.group.create') }}</button>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { RouterLink, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useChatStore } from '../stores/chat.js'
  import { useFriendStore } from '../stores/friends.js'

  const { t } = useI18n()
  const router = useRouter()
  const chatStore = useChatStore()
  const friendStore = useFriendStore()

  const name = ref('')
  const selectedIds = ref([])
  const creating = ref(false)
  const error = ref('')

  function initials(u) {
    const n = u?.displayName || u?.email || '?'
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  async function submit() {
    error.value = ''
    if (!name.value.trim()) { error.value = t('chat.group.nameRequired'); return }
    if (selectedIds.value.length < 2) { error.value = t('chat.group.minMembers'); return }

    creating.value = true
    const result = await chatStore.createGroup({ name: name.value.trim(), participantIds: selectedIds.value })
    creating.value = false

    if (result?._id) router.push(`/chat/group/${result._id}`)
    else error.value = chatStore.error || t('common.error')
  }

  onMounted(() => {
    friendStore.fetchFriends()
  })
</script>

<style scoped>
  .page-header {
    @apply flex items-center gap-4 mb-4;
  }

  .form-card {
    @apply flex flex-col gap-1.5;
  }

  .members-label {
    @apply mt-3;
  }

  .friends-list {
    @apply flex flex-col gap-0.5 max-h-80 overflow-y-auto;
  }

  .friend-check {
    @apply flex items-center gap-2 px-1 py-2 rounded-sm cursor-pointer hover:bg-surface-2 transition-colors text-sm;
  }

  .friend-check input {
    @apply w-auto;
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
