<template>
  <div>
    <!-- Ricerca utenti -->
    <div class="card search-card">
      <label>{{ t('friends.search.label') }}</label>
      <input v-model="query" type="text" :placeholder="t('friends.search.placeholder')" @input="onSearch" />
      <ul v-if="query.trim().length >= 2" class="search-results">
        <li v-for="u in userStore.results" :key="u._id" class="search-result-row">
          <RouterLink :to="`/users/${u._id}`" class="member-info">
            <img v-if="u.avatar" :src="u.avatar" class="mini-avatar" />
            <span v-else class="mini-placeholder">{{ initials(u) }}</span>
            <span class="member-text">
              <span class="member-name">{{ u.displayName || u.email }}</span>
              <span v-if="u.displayName && u.email" class="member-email">{{ u.email }}</span>
            </span>
          </RouterLink>
          <button
            class="btn btn-secondary btn-sm"
            :disabled="requestStatus[u._id] === 'sending'"
            v-if="!statusFor(u._id)"
            @click="sendRequest(u)"
          >{{ t('friends.actions.add') }}</button>
          <span v-else class="badge badge-ocean">{{ t(`friends.status.${statusFor(u._id)}`) }}</span>
        </li>
        <li v-if="!userStore.loading && !userStore.results.length" class="no-results">{{ t('friends.search.noResults') }}</li>
      </ul>
    </div>

    <!-- Richieste ricevute -->
    <section v-if="friendStore.received.length" class="section-block">
      <h2 class="section-label">{{ t('friends.received.title') }} · {{ friendStore.received.length }}</h2>
      <div class="people-list">
        <div v-for="r in friendStore.received" :key="r._id" class="member-row">
          <RouterLink :to="`/users/${r.requester._id}`" class="member-info">
            <img v-if="r.requester.avatar" :src="r.requester.avatar" class="mini-avatar" />
            <span v-else class="mini-placeholder">{{ initials(r.requester) }}</span>
            <span class="member-text">
              <span class="member-name">{{ r.requester.displayName || r.requester.email }}</span>
              <span v-if="r.requester.displayName && r.requester.email" class="member-email">{{ r.requester.email }}</span>
            </span>
          </RouterLink>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" @click="accept(r)">{{ t('friends.actions.accept') }}</button>
            <button class="icon-btn icon-btn-bordered" :title="t('friends.actions.decline')" :aria-label="t('friends.actions.decline')" @click="decline(r)"><AppIcon name="chiudi" :size="18" /></button>
          </div>
        </div>
      </div>
    </section>

    <!-- Richieste inviate -->
    <section v-if="friendStore.sent.length" class="section-block">
      <h2 class="section-label">{{ t('friends.sent.title') }} · {{ friendStore.sent.length }}</h2>
      <div class="people-list">
        <div v-for="r in friendStore.sent" :key="r._id" class="member-row">
          <RouterLink :to="`/users/${r.recipient._id}`" class="member-info">
            <img v-if="r.recipient.avatar" :src="r.recipient.avatar" class="mini-avatar" />
            <span v-else class="mini-placeholder">{{ initials(r.recipient) }}</span>
            <span class="member-text">
              <span class="member-name">{{ r.recipient.displayName || r.recipient.email }}</span>
              <span v-if="r.recipient.displayName && r.recipient.email" class="member-email">{{ r.recipient.email }}</span>
            </span>
          </RouterLink>
          <button class="btn btn-ghost btn-sm" @click="cancel(r)">{{ t('friends.actions.cancel') }}</button>
        </div>
      </div>
    </section>

    <!-- Lista amici -->
    <section class="section-block">
      <h2 class="section-label">{{ t('friends.list.title') }}<template v-if="friendStore.friends.length"> · {{ friendStore.friends.length }}</template></h2>

      <div v-if="friendStore.loading" class="state-center"><div class="spinner"></div></div>

      <div v-else-if="!friendStore.friends.length" class="state-center">
        <div style="font-size:3rem; display:flex; justify-content:center"><Users :size="48" /></div>
        <p class="text-muted mt-1">{{ t('friends.list.empty') }}</p>
      </div>

      <div v-else class="people-list">
        <div v-for="f in friendStore.friends" :key="f._id" class="member-row">
          <RouterLink :to="`/users/${f._id}`" class="member-info">
            <img v-if="f.avatar" :src="f.avatar" class="mini-avatar" />
            <span v-else class="mini-placeholder">{{ initials(f) }}</span>
            <span class="member-text">
              <span class="member-name">{{ f.displayName || f.email }}</span>
              <span v-if="f.displayName && f.email" class="member-email">{{ f.email }}</span>
            </span>
          </RouterLink>
          <div class="row-actions">
            <RouterLink :to="`/chat/${f._id}`" class="icon-btn icon-btn-primary" :title="t('friends.actions.message')" :aria-label="t('friends.actions.message')">
              <AppIcon name="community" :size="18" />
            </RouterLink>
            <button class="icon-btn" :title="t('friends.actions.remove')" :aria-label="t('friends.actions.remove')" @click="removeFriend(f)">
              <UserX :size="16" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import AppIcon from '../components/AppIcon.vue'
import { ref, reactive, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Users, UserX } from 'lucide-vue-next'
import { useFriendStore } from '../stores/friends.js'
import { useUserStore } from '../stores/users.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'
import { useToast } from '../composables/useToast.js'

const { t } = useI18n()
const friendStore = useFriendStore()
const userStore   = useUserStore()
const { toast }   = useToast()

const query = ref('')
// stato locale per riga di ricerca: 'sending' mentre parte la richiesta,
// altrimenti lo stato effettivo (sent/received/friends) una volta noto
const requestStatus = reactive({})

onMounted(() => {
  friendStore.fetchFriends()
  friendStore.fetchRequests()
})

function initials(u) {
  const name = u.displayName || u.email || '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

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

async function accept(r) {
  await friendStore.acceptRequest(r._id)
  toast(t('friends.toasts.accepted'), { type: 'success' })
}

async function decline(r) {
  await friendStore.declineRequest(r._id)
}

async function cancel(r) {
  await friendStore.declineRequest(r._id)
}

async function removeFriend(f) {
  if (!window.confirm(t('friends.actions.confirmRemove', { name: f.displayName || f.email }))) return
  await friendStore.removeFriend(f._id)
}
</script>

<style scoped>
.search-card  { @apply mb-4 relative; }
.section-label { @apply text-xs font-bold uppercase text-muted mb-2 mt-5; letter-spacing: 0.14em; }
.search-results {
  @apply flex flex-col gap-1 mt-2 max-h-64 overflow-y-auto;
}
.search-result-row { @apply flex items-center justify-between gap-2 py-1.5; }
.search-result-row .btn, .search-result-row .badge { @apply shrink-0 whitespace-nowrap; }
.no-results { @apply text-muted text-sm py-2; }

.section-block { @apply mb-4; }

.people-list { @apply flex flex-col gap-2; }
.member-row  { @apply flex items-center justify-between gap-2 px-3 min-h-[64px] bg-surface border border-border/60 rounded-xl; }
.member-info { @apply flex items-center gap-3 text-base font-semibold text-foam no-underline min-w-0 flex-1 min-h-[44px]; }

.icon-btn {
  @apply flex items-center justify-center w-11 h-11 rounded-lg text-muted bg-transparent border-none
         cursor-pointer hover:bg-surface-2 hover:text-danger transition-colors shrink-0;
}
.member-text { @apply flex flex-col leading-tight min-w-0; }
.member-name { @apply truncate; }
.member-email { @apply text-xs text-muted truncate; }
.row-actions { @apply flex items-center gap-2 shrink-0; }
.icon-btn-bordered { @apply border border-border-light; }
.icon-btn-primary { @apply text-ocean-text bg-surface-2 border border-border-light hover:text-ocean-text; }

.mini-avatar { @apply w-10 h-10 rounded-full object-cover shrink-0; }
.mini-placeholder {
  @apply w-10 h-10 shrink-0 rounded-full border border-ocean text-ocean-text flex items-center
         justify-center text-xs font-bold;
  background: var(--ocean-glow);
}
</style>
