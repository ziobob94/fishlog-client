<template>
  <div>
    <div class="page-header">
      <RouterLink to="/friends" class="btn btn-ghost btn-sm">{{ t('common.back') }}</RouterLink>
    </div>

    <div v-if="loading" class="state-center"><div class="spinner"></div></div>

    <div v-else-if="!user" class="state-center">
      <p class="text-muted">{{ t('friends.profile.notFound') }}</p>
    </div>

    <div v-else class="card profile-card">
      <div class="profile-head">
        <img v-if="user.avatar" :src="user.avatar" class="avatar" />
        <span v-else class="avatar-placeholder">{{ initials }}</span>
        <div>
          <h2>{{ user.displayName || t('session.untitled') }}</h2>
          <p class="text-muted" style="font-size:.85rem">{{ t('friends.profile.memberSince', { date: memberSince }) }}</p>
        </div>
      </div>

      <div class="friend-action">
        <button v-if="status === 'none'" class="btn btn-primary btn-sm" :disabled="acting" @click="onSend">{{ t('friends.actions.add') }}</button>
        <button v-else-if="status === 'sent'" class="btn btn-ghost btn-sm" :disabled="acting" @click="onCancel">{{ t('friends.actions.cancel') }}</button>
        <div v-else-if="status === 'received'" class="row-actions">
          <button class="btn btn-primary btn-sm" :disabled="acting" @click="onAccept">{{ t('friends.actions.accept') }}</button>
          <button class="btn btn-ghost btn-sm" :disabled="acting" @click="onCancel">{{ t('friends.actions.decline') }}</button>
        </div>
        <div v-else-if="status === 'friends'" class="row-actions">
          <span class="badge badge-success">{{ t('friends.status.friends') }}</span>
          <button class="btn btn-ghost btn-sm" :disabled="acting" @click="onRemove">{{ t('friends.actions.remove') }}</button>
        </div>
      </div>

      <div class="section-divider">{{ t('friends.profile.commonGroups') }}</div>
      <p v-if="!commonGroups.length" class="text-muted text-sm">{{ t('friends.profile.noCommonGroups') }}</p>
      <ul v-else class="common-groups">
        <li v-for="g in commonGroups" :key="g._id" class="badge badge-ocean">{{ g.name }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/users.js'
import { useFriendStore } from '../stores/friends.js'

const { t } = useI18n()
const route = useRoute()
const userStore   = useUserStore()
const friendStore = useFriendStore()

const user         = ref(null)
const loading      = ref(true)
const status       = ref('none')
const requestId    = ref(null)
const commonGroups = ref([])
const acting       = ref(false)

const initials = computed(() => {
  const name = user.value?.displayName || '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

const memberSince = computed(() => user.value?.createdAt ? new Date(user.value.createdAt).toLocaleDateString() : '')

async function load() {
  loading.value = true
  const id = route.params.id
  const [u, st, groups] = await Promise.all([
    userStore.fetchUser(id),
    friendStore.fetchStatus(id),
    friendStore.fetchCommonGroups(id)
  ])
  user.value = u
  status.value = st.status
  requestId.value = st.requestId || null
  commonGroups.value = groups
  loading.value = false
}

onMounted(load)

async function onSend() {
  acting.value = true
  const ok = await friendStore.sendRequest(route.params.id)
  if (ok) status.value = 'sent'
  acting.value = false
}

async function onCancel() {
  if (!requestId.value) return
  acting.value = true
  await friendStore.declineRequest(requestId.value)
  status.value = 'none'
  requestId.value = null
  acting.value = false
}

async function onAccept() {
  if (!requestId.value) return
  acting.value = true
  await friendStore.acceptRequest(requestId.value)
  status.value = 'friends'
  acting.value = false
}

async function onRemove() {
  acting.value = true
  await friendStore.removeFriend(route.params.id)
  status.value = 'none'
  acting.value = false
}
</script>

<style scoped>
.page-header { @apply mb-4; }
.profile-card { @apply max-w-lg; }
.profile-head { @apply flex items-center gap-3 mb-4; }

.avatar { @apply w-16 h-16 rounded-full object-cover; }
.avatar-placeholder {
  @apply w-16 h-16 rounded-full border border-ocean text-ocean flex items-center
         justify-center text-lg font-bold;
  background: var(--ocean-glow);
}

.friend-action { @apply mb-2; }
.row-actions { @apply flex items-center gap-2; }

.common-groups { @apply flex flex-wrap gap-2; }
</style>
