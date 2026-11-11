<template>
  <div>
    <PageHeader :title="user?.displayName || t('nav.profile')" back />

    <div v-if="loading" class="state-center"><div class="spinner"></div></div>

    <div v-else-if="!user" class="state-center">
      <p class="text-muted">{{ t('friends.profile.notFound') }}</p>
    </div>

    <div v-else>
    <div class="card profile-card">
      <div class="profile-head">
        <img v-if="user.avatar" :src="user.avatar" class="avatar" />
        <span v-else class="avatar-placeholder">{{ initials }}</span>
        <div>
          <h2>{{ user.displayName || t('session.untitled') }}</h2>
          <p class="text-muted" style="font-size:.85rem">{{ t('friends.profile.memberSince', { date: memberSince }) }}</p>
        </div>
      </div>

      <div v-if="user.stats" class="profile-stats">
        <div class="pstat"><span class="pstat-n font-mono">{{ user.stats.sessionsCount }}</span><span class="pstat-l">{{ t('friends.profile.sessions') }}</span></div>
        <div class="pstat"><span class="pstat-n font-mono">{{ user.stats.catchesCount }}</span><span class="pstat-l">{{ t('friends.profile.catches') }}</span></div>
        <div class="pstat"><span class="pstat-n font-mono">{{ posts.feed.length }}</span><span class="pstat-l">{{ t('friends.profile.posts') }}</span></div>
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
          <button class="icon-btn" :disabled="acting" :title="t('friends.actions.remove')" @click="onRemove">
            <UserX :size="16" />
          </button>
        </div>
      </div>

      <TideDivider>{{ t('friends.profile.commonGroups') }}</TideDivider>
      <p v-if="!commonGroups.length" class="text-muted text-sm">{{ t('friends.profile.noCommonGroups') }}</p>
      <ul v-else class="common-groups">
        <li v-for="g in commonGroups" :key="g._id" class="badge badge-ocean">{{ g.name }}</li>
      </ul>
    </div>

    <TideDivider class="mt-6">{{ t('friends.profile.postsTitle') }}</TideDivider>
    <p v-if="!posts.feed.length" class="text-muted text-sm">{{ t('friends.profile.noPosts') }}</p>
    <div v-else class="profile-posts -mx-4 sm:mx-0">
      <PostCard
        v-for="p in posts.feed" :key="p._id" :post="p"
        @delete="po => posts.deletePost(po._id)"
        @like="po => posts.toggleLike(po._id, auth.user?._id)"
        @save="po => posts.toggleSave(po._id)"
        @comment="(po, m) => posts.addComment(po._id, m)"
        @delete-comment="(po, c) => posts.deleteComment(po._id, c._id)"
        @respond="(po, m) => posts.respond(po._id, m)"
        @attend="(po, st, g) => posts.setAttendance(po._id, st, g)"
        @close-event="po => posts.setEventStatus(po._id, 'closed')"
      />
    </div>
    </div>
  </div>
</template>

<script setup>
import { toInitials } from '../utils/initials.js'
import PageHeader from '../components/PageHeader.vue'
import TideDivider from '../components/TideDivider.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { UserX } from 'lucide-vue-next'
import { useUserStore } from '../stores/users.js'
import { useFriendStore } from '../stores/friends.js'
import { usePostStore } from '../stores/posts.js'
import { useAuthStore } from '../stores/auth.js'
import PostCard from '../components/post/PostCard.vue'

const { t } = useI18n()
const route = useRoute()
const userStore   = useUserStore()
const friendStore = useFriendStore()
const posts       = usePostStore()
const auth        = useAuthStore()
const router      = useRouter()

const user         = ref(null)
const loading      = ref(true)
const status       = ref('none')
const requestId    = ref(null)
const commonGroups = ref([])
const acting       = ref(false)

const initials = computed(() => {
  const name = user.value?.displayName || '?'
return toInitials(name)
})

const memberSince = computed(() => user.value?.createdAt ? new Date(user.value.createdAt).toLocaleDateString() : '')

async function load() {
  const id = route.params.id
  // Il proprio profilo è la bacheca: niente azioni di amicizia verso se stessi.
  if (auth.user?._id && String(id) === String(auth.user._id)) { router.replace('/board'); return }
  loading.value = true
  const [u, st, groups] = await Promise.all([
    userStore.fetchUser(id),
    friendStore.fetchStatus(id),
    friendStore.fetchCommonGroups(id),
    posts.fetchPosts({ author: id })
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
  if (!window.confirm(t('friends.actions.confirmRemove', { name: user.value?.displayName || user.value?.email }))) return
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
  @apply w-16 h-16 rounded-full border border-ocean text-ocean-text flex items-center
         justify-center text-lg font-bold;
  background: var(--ocean-glow);
}

.friend-action { @apply mb-2; }
.row-actions { @apply flex items-center gap-2; }

.icon-btn {
  @apply flex items-center justify-center w-11 h-11 rounded-lg text-muted bg-transparent border-none
         cursor-pointer hover:bg-surface-2 hover:text-danger transition-colors shrink-0;
}

.common-groups { @apply flex flex-wrap gap-2; }
.profile-stats { @apply grid grid-cols-3 gap-2 mb-4; }
.pstat { @apply flex flex-col items-center gap-0.5 py-2.5 rounded-xl bg-surface-2/60 border border-border/60; }
.pstat-n { @apply text-lg font-bold text-foam; }
.pstat-l { @apply text-[0.7rem] uppercase text-muted; letter-spacing: 0.14em; }
.profile-posts { @apply flex flex-col gap-5 mt-3; }
</style>
