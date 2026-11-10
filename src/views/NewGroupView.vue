<template>
  <div class="new-group">
    <PageHeader :title="t('chat.group.newTitle')" back="/chat" />

    <label for="group-name" class="field-label">{{ t('chat.group.nameLabel') }}</label>
    <input id="group-name" v-model="name" type="text" class="name-input" :placeholder="t('chat.group.namePlaceholder')" maxlength="60" />

    <div class="members-head">
      <span class="field-label">{{ t('chat.group.membersLabel') }}</span>
      <span v-if="selectedIds.length" class="selected-count">{{ t('chat.group.selected', { n: selectedIds.length }) }}</span>
    </div>
    <p v-if="!friendStore.friends.length" class="text-muted text-sm">{{ t('chat.group.noFriends') }}</p>
    <div v-else class="friends-list">
      <label v-for="f in friendStore.friends" :key="f._id" class="friend-check" :class="{ on: selectedIds.includes(f._id) }">
        <img v-if="f.avatar" :src="f.avatar" class="mini-avatar" alt="" />
        <span v-else class="mini-placeholder">{{ initials(f) }}</span>
        <span class="member-name">{{ f.displayName || f.email }}</span>
        <input type="checkbox" :value="f._id" v-model="selectedIds" class="check" />
      </label>
    </div>

    <p v-if="error" class="text-danger text-sm mt-2">{{ error }}</p>

    <div class="cta-bar">
      <button type="button" class="btn btn-primary cta" :disabled="creating" @click="submit">
        {{ creating ? t('chat.group.creating') : t('chat.group.create') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { toInitials } from '../utils/initials.js'
import PageHeader from '../components/PageHeader.vue'
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
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
return toInitials(n)
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
  .new-group { @apply pb-24; }
  .field-label { @apply block text-xs font-bold uppercase text-muted mb-2 mt-1; letter-spacing: 0.14em; }
  .name-input { @apply w-full min-h-[48px] text-base mb-5; }
  .members-head { @apply flex items-baseline justify-between; }
  .selected-count { @apply text-xs font-bold text-ocean-text; }
  .friends-list { @apply flex flex-col gap-2; }
  .friend-check {
    @apply flex items-center gap-3 px-3 min-h-[64px] rounded-xl border border-border bg-surface cursor-pointer transition-colors text-foam;
  }
  .friend-check.on { @apply border-ocean; background: var(--ocean-glow); }
  .friend-check .check {
    appearance: none; -webkit-appearance: none; @apply shrink-0 cursor-pointer rounded-md border-2 border-border bg-transparent grid place-items-center;
    width: 1.625rem; height: 1.625rem;
  }
  .friend-check .check:checked { @apply bg-ocean border-ocean; }
  .friend-check .check:checked::after {
    content: ''; width: 0.4rem; height: 0.75rem; margin-top: -0.1rem;
    border: solid rgb(var(--color-on-primary, 11 22 35)); border-width: 0 3px 3px 0; transform: rotate(45deg);
  }
  .member-name { @apply truncate flex-1 min-w-0 font-bold normal-case; letter-spacing: normal; }
  .mini-avatar { @apply w-10 h-10 rounded-full object-cover shrink-0; }
  .mini-placeholder {
    @apply w-10 h-10 rounded-full border border-ocean text-ocean-text flex items-center justify-center text-xs font-bold shrink-0;
    background: var(--ocean-glow);
  }
  .cta-bar {
    @apply fixed left-0 right-0 z-20 px-4 py-3 bg-surface border-t border-border;
    bottom: 0;
  }
  @media (min-width: 768px) {
    .cta-bar { position: static; @apply border-none bg-transparent px-0 pt-6; }
    .cta { @apply max-w-xs mx-0; }
  }
  .cta { @apply w-full min-h-[48px] max-w-[1100px] mx-auto; display: flex; }
</style>
