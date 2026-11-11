<template>
  <div class="board">
    <PageHeader :title="auth.user?.username || auth.user?.displayName || t('nav.board')" back>
      <button type="button" class="ph-btn" :aria-label="t('profile.menu.title')" @click="menuOpen = true"><Menu :size="20" /></button>
    </PageHeader>

    <ProfileHeader :user="auth.user" :own="ownStory" :stats="stats" />

    <div class="tabs" role="tablist" :aria-label="t('nav.board')">
      <button v-for="tb in TABS" :key="tb.id" type="button" role="tab" :aria-selected="tab === tb.id" class="tab" :class="{ on: tab === tb.id }" @click="setTab(tb.id)">
        <component :is="tb.icon" :size="18" /> {{ t(tb.label) }}
      </button>
    </div>

    <!-- Caricamento: skeleton -->
    <div v-if="infiniteLoading" class="skeleton-grid" role="status" :aria-label="t('common.loading')">
      <span v-for="n in 9" :key="n" class="skeleton"></span>
    </div>

    <!-- Errore -->
    <div v-else-if="loadError" class="state-center mt-4" role="alert">
      <h3>{{ t('posts.board.errorTitle') }}</h3>
      <p class="text-muted mt-1">{{ t('posts.board.errorText') }}</p>
      <button type="button" class="btn btn-secondary btn-sm mt-3" @click="load">{{ t('common.retry') }}</button>
    </div>

    <!-- Vuota -->
    <div v-else-if="!items.length" class="state-center mt-4">
      <div style="font-size:3rem; display:flex; justify-content:center"><component :is="emptyIcon" :size="48" /></div>
      <h3>{{ t(`profile.board.empty.${tab}.title`) }}</h3>
      <p class="text-muted mt-1">{{ t(`profile.board.empty.${tab}.text`) }}</p>
      <RouterLink v-if="tab === 'posts'" to="/post/new?from=board" class="btn btn-primary btn-sm mt-3">{{ t('profile.board.createFirst') }}</RouterLink>
    </div>

    <template v-else>
      <PostGrid :items="items" />
      <InfiniteSentinel :active="hasMore" :loading="loadingMore" @trigger="loadMore" />
    </template>

    <ProfileMenu :open="menuOpen" @close="menuOpen = false" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Menu, LayoutGrid, Fish, Bookmark } from 'lucide-vue-next'
import PageHeader from '../components/PageHeader.vue'
import ProfileHeader from '../components/profile/ProfileHeader.vue'
import PostGrid from '../components/profile/PostGrid.vue'
import ProfileMenu from '../components/profile/ProfileMenu.vue'
import InfiniteSentinel from '../components/InfiniteSentinel.vue'
import { usePostStore } from '../stores/posts.js'
import { useSessionStore } from '../stores/sessions.js'
import { useAuthStore } from '../stores/auth.js'
import { useStoryStore } from '../stores/stories.js'
import { useInfiniteScroll } from '../composables/useInfiniteScroll.js'
import api from '../utils/api.js'

const { t } = useI18n()
const posts = usePostStore()
const sessions = useSessionStore()
const auth = useAuthStore()
const stories = useStoryStore()

const TABS = [
  { id: 'posts', label: 'profile.board.tabPosts', icon: LayoutGrid },
  { id: 'sessions', label: 'profile.board.tabSessions', icon: Fish },
  { id: 'saved', label: 'profile.board.tabSaved', icon: Bookmark }
]
const tab = ref('posts')
const menuOpen = ref(false)
const loadError = ref(false)
const stats = ref({ sessionsCount: 0, catchesCount: 0, friendsCount: 0 })
const ownStory = computed(() => stories.groups.find(g => g.own) || null)
const emptyIcon = computed(() => TABS.find(x => x.id === tab.value).icon)

const pagesRef = computed(() => (tab.value === 'sessions' ? sessions.pagination?.pages : posts.pagination?.pages))
const { loading: infiniteLoading, loadingMore, hasMore, reset, loadMore } = useInfiniteScroll((page, { append }) => {
  if (tab.value === 'sessions') return sessions.fetchSessions({ page }, { append })
  if (tab.value === 'saved') return posts.fetchPosts({ scope: 'saved', page }, { append })
  return posts.fetchPosts({ author: auth.user?._id, page }, { append })
}, pagesRef)

const isVideo = m => (m?.mimetype || '').startsWith('video/')
const items = computed(() => {
  if (tab.value === 'sessions') {
    return sessions.sessions.map(s => ({
      id: s._id, to: `/session/${s._id}`, url: s.media?.[0]?.url, isVideo: isVideo(s.media?.[0]), multi: (s.media?.length || 0) > 1,
      text: s.title || s.location?.name || t('session.untitled'), label: s.title || s.location?.name || t('session.untitled')
    }))
  }
  return posts.feed.map(p => ({
    id: p._id, to: `/post/${p._id}`, url: p.media?.[0]?.url, isVideo: isVideo(p.media?.[0]), multi: (p.media?.length || 0) > 1,
    text: p.title || p.body, label: p.title || p.body
  }))
})

async function load() {
  loadError.value = false
  posts.error = null; sessions.error = null
  try { await reset() } catch { loadError.value = true }
  if ((tab.value === 'sessions' ? sessions.error : posts.error) && !items.value.length) loadError.value = true
}
function setTab(id) { tab.value = id; load() }

onMounted(async () => {
  load()
  stories.fetchRail()
  posts.markSeen('board')
  try { stats.value = (await api.get('/users/me/stats')).data } catch { /* conteggi accessori */ }
})
</script>

<style scoped>
.tabs { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin: 0 -1rem 2px; }
.tab { display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 48px; background: none; border: 0; border-bottom: 2px solid transparent; color: var(--text-muted); font-weight: 700; font-size: 14px; cursor: pointer; }
.tab.on { color: var(--foam); border-bottom-color: var(--ocean); }
.board :deep(.grid), .skeleton-grid { margin: 0 -1rem; }
.skeleton-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
.skeleton { aspect-ratio: 1; background: linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%); background-size: 200% 100%; animation: sk 1.4s linear infinite; }
@keyframes sk { to { background-position: -200% 0; } }
@media (min-width: 640px) { .tabs, .board :deep(.grid), .skeleton-grid { margin-left: -1.5rem; margin-right: -1.5rem; } }
</style>
