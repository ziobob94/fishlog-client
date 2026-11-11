<template>
  <div>
    <PageHeader :title="t('nav.board')" back />

    <!-- Profilo: anello con «+» per creare una storia, conteggi in mono -->
    <section class="board-head">
      <RouterLink to="/story/new?from=board" class="avatar-ring" :aria-label="t('stories.new')">
        <span class="avatar"><img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="" /><template v-else>{{ initials }}</template></span>
        <span class="plus"><Plus :size="16" :stroke-width="2.6" /></span>
      </RouterLink>
      <div class="who">
        <strong class="name">{{ auth.user?.displayName || auth.user?.email }}</strong>
        <div class="stats">
          <div><span class="fl-mono num">{{ counts.post }}</span><span class="lbl">{{ t('posts.board.statPosts') }}</span></div>
          <div><span class="fl-mono num">{{ counts.event }}</span><span class="lbl">{{ t('posts.board.statEvents') }}</span></div>
          <div><span class="fl-mono num">{{ friendStore.friends.length }}</span><span class="lbl">{{ t('posts.board.statFriends') }}</span></div>
        </div>
      </div>
    </section>

    <div class="chips" role="radiogroup" :aria-label="t('posts.board.filter')">
      <button v-for="f in FILTERS" :key="f.id" type="button" role="radio" :aria-checked="filter === f.id" class="chip" :class="{ on: filter === f.id }" @click="setFilter(f.id)">{{ t(f.label) }}</button>
    </div>

    <!-- Caricamento: skeleton -->
    <div v-if="infiniteLoading" class="skeletons" role="status" :aria-label="t('common.loading')">
      <div v-for="n in 3" :key="n" class="skeleton"></div>
    </div>

    <!-- Errore -->
    <div v-else-if="loadError" class="state-center mt-4" role="alert">
      <h3>{{ t('posts.board.errorTitle') }}</h3>
      <p class="text-muted mt-1">{{ t('posts.board.errorText') }}</p>
      <button type="button" class="btn btn-secondary btn-sm mt-3" @click="load">{{ t('common.retry') }}</button>
    </div>

    <div v-else-if="!store.feed.length" class="state-center mt-4">
      <div style="font-size:3rem; display:flex; justify-content:center"><Pin :size="48" /></div>
      <h3>{{ t('posts.board.empty.title') }}</h3>
      <p class="text-muted mt-1">{{ t('posts.board.empty.text') }}</p>
    </div>

    <div v-else class="posts-list mt-4">
      <PostCard
        v-for="p in store.feed"
        :key="p._id"
        :post="p"
        @delete="onDelete"
        @close-event="onCloseEvent"
        @respond="onRespond"
        @like="onLike"
        @comment="onComment"
        @delete-comment="onDeleteComment"
        @attend="onAttend"
      />
      <InfiniteSentinel :active="hasMore" :loading="loadingMore" @trigger="loadMore" />
    </div>
  </div>
</template>

<script setup>
import PageHeader from '../components/PageHeader.vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Pin, Plus } from 'lucide-vue-next'
import { usePostStore } from '../stores/posts.js'
import { useAuthStore } from '../stores/auth.js'
import { useFriendStore } from '../stores/friends.js'
import { toInitials } from '../utils/initials.js'
import api from '../utils/api.js'
import { useInfiniteScroll } from '../composables/useInfiniteScroll.js'
import PostCard from '../components/post/PostCard.vue'
import InfiniteSentinel from '../components/InfiniteSentinel.vue'

const { t } = useI18n()
const store = usePostStore()
const auth  = useAuthStore()
const friendStore = useFriendStore()

const FILTERS = [
  { id: '', label: 'posts.board.filterAll' },
  { id: 'post', label: 'posts.board.filterPosts' },
  { id: 'event', label: 'posts.board.filterEvents' }
]
const filter = ref('')
const loadError = ref(false)
const counts = ref({ post: 0, event: 0 })
const initials = computed(() => toInitials(auth.user?.displayName || auth.user?.email || '?'))

const pagesRef = computed(() => store.pagination.pages)
const { loading: infiniteLoading, loadingMore, hasMore, reset, loadMore } = useInfiniteScroll(
  (page, { append }) => store.fetchPosts({ author: auth.user?._id, page, ...(filter.value ? { type: filter.value } : {}) }, { append }),
  pagesRef
)

async function loadCounts() {
  try {
    const [p, e] = await Promise.all(['post', 'event'].map(type => api.get('/posts', { params: { author: auth.user?._id, type, limit: 1 } })))
    counts.value = { post: p.data.pagination?.total ?? 0, event: e.data.pagination?.total ?? 0 }
  } catch { /* i conteggi sono accessori */ }
}

async function load() {
  loadError.value = false
  store.error = null
  try { await reset() } catch { loadError.value = true }
  if (store.error && !store.feed.length) loadError.value = true
}
function setFilter(id) { filter.value = id; load() }

onMounted(() => {
  load()
  loadCounts()
  friendStore.fetchFriends()
  store.markSeen('board')
})

async function onDelete(post) { await store.deletePost(post._id); loadCounts() }
async function onCloseEvent(post) { await store.setEventStatus(post._id, 'closed') }
async function onRespond(post, message) { await store.respond(post._id, message) }
async function onLike(post) { await store.toggleLike(post._id, auth.user?._id) }
async function onComment(post, message) { await store.addComment(post._id, message) }
async function onDeleteComment(post, comment) { await store.deleteComment(post._id, comment._id) }
async function onAttend(post, status, guests) { await store.setAttendance(post._id, status, guests) }
</script>

<style scoped>
.board-head { display: flex; align-items: center; gap: 16px; margin: 4px 0 16px; }
.avatar-ring { position: relative; flex: none; width: 76px; height: 76px; border-radius: 50%; border: 2px dashed var(--border-light); padding: 4px; display: flex; text-decoration: none; box-sizing: border-box; }
.avatar { width: 100%; height: 100%; border-radius: 50%; background: var(--ocean-glow); border: 1px solid var(--ocean); color: rgb(var(--color-ocean-text)); font-weight: 800; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.plus { position: absolute; right: -2px; bottom: -2px; width: 26px; height: 26px; border-radius: 50%; background: var(--ocean); color: rgb(var(--color-on-primary)); border: 2px solid rgb(var(--color-ink)); display: flex; align-items: center; justify-content: center; }
.who { min-width: 0; flex: 1; }
.name { display: block; font-size: 17px; font-weight: 800; color: var(--foam); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stats { display: flex; gap: 22px; margin-top: 6px; }
.stats > div { display: flex; flex-direction: column; }
.num { font-size: 22px; color: var(--foam); line-height: 1.1; }
.lbl { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.chips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.chip { min-height: 44px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--foam); font-weight: 700; font-size: 14px; cursor: pointer; }
.chip.on { background: var(--ocean); border-color: var(--ocean); color: rgb(var(--color-on-primary)); }
.skeletons { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
.skeleton { height: 220px; border-radius: 24px; background: linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%); background-size: 200% 100%; animation: sk 1.4s linear infinite; }
@keyframes sk { to { background-position: -200% 0; } }
.posts-list  { @apply flex flex-col gap-3 sm:gap-4; }
</style>
