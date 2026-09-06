<template>
  <div>
    <div class="page-header">
      <div>
        <h2>{{ t('posts.feed.titlePrefix') }} <span class="text-ocean">{{ t('posts.feed.titleHighlight') }}</span></h2>
        <p class="page-desc">{{ t('posts.feed.description') }}</p>
      </div>
    </div>

    <div class="tabs-row">
      <div class="tabs" role="tablist">
        <button
          type="button" role="tab" :aria-selected="tab === 'post'"
          class="tab-btn" :class="{ active: tab === 'post' }"
          @click="setTab('post')"
        ><Newspaper :size="15" /> {{ t('posts.tabs.posts') }}</button>
        <button
          type="button" role="tab" :aria-selected="tab === 'event'"
          class="tab-btn" :class="{ active: tab === 'event' }"
          @click="setTab('event')"
        ><CalendarDays :size="15" /> {{ t('posts.tabs.events') }}</button>
      </div>
      <button type="button" class="btn btn-sm btn-primary ml-auto" @click="showForm = !showForm">
        <Plus :size="14" /> {{ showForm ? t('posts.feed.hideForm') : t('posts.feed.newPost') }}
      </button>
    </div>

    <template v-if="showForm">
      <div class="post-form-wrap">
        <PostForm :create-fn="store.createPost" :initial-type="tab" @created="onCreated" />
      </div>
      <div class="section-separator"></div>
    </template>

    <button type="button" class="filters-toggle" @click="showFilters = !showFilters">
      <Filter :size="15" />
      <span>{{ t('posts.filters.title') }}</span>
      <ChevronDown :size="16" class="chevron" :class="{ open: showFilters }" />
    </button>

    <div v-if="showFilters" class="filters-panel">
      <p class="filters-desc">{{ t('posts.filters.description') }}</p>

      <div class="filters-grid">
        <div class="filter-field">
          <label>{{ t('posts.filters.visibilityLabel') }}</label>
          <select v-model="filters.visibility" @change="reload">
            <option value="">{{ t('posts.filters.allVisibility') }}</option>
            <option value="public">{{ t('posts.visibility.public') }}</option>
            <option value="group">{{ t('posts.visibility.group') }}</option>
            <option value="private">{{ t('posts.visibility.private') }}</option>
          </select>
        </div>

        <div class="filter-field">
          <label>{{ t('posts.filters.dateFrom') }}</label>
          <input type="date" v-model="filters.dateFrom" @change="reload" />
        </div>

        <div class="filter-field">
          <label>{{ t('posts.filters.dateTo') }}</label>
          <input type="date" v-model="filters.dateTo" @change="reload" />
        </div>

        <div class="filter-field author-filter">
          <label>{{ t('posts.filters.authorLabel') }}</label>
          <input
            v-if="!selectedAuthor"
            v-model="authorQuery"
            type="text"
            :placeholder="t('posts.filters.authorPlaceholder')"
            @input="onAuthorSearch"
          />
          <span v-else class="chip">
            {{ selectedAuthor.displayName || selectedAuthor.email }}
            <button type="button" @click="clearAuthor"><X :size="12" /></button>
          </span>
          <div v-if="userResults.length" class="author-results">
            <button v-for="u in userResults" :key="u._id" type="button" class="author-result-row" @click="pickAuthor(u)">
              {{ u.displayName || u.email }}
            </button>
          </div>
        </div>

        <template v-if="tab === 'event'">
          <div class="filter-field">
            <label>{{ t('posts.filters.locationLabel') }}</label>
            <button type="button" class="btn btn-ghost btn-sm" :disabled="locating" @click="useMyLocation">
              <MapPin :size="14" /> {{ filters.near ? t('posts.filters.locationSet') : t('posts.filters.useMyLocation') }}
            </button>
          </div>

          <div v-if="filters.near" class="filter-field">
            <label>{{ t('posts.filters.radiusLabel') }}</label>
            <input
              type="number"
              min="1"
              v-model.number="filters.radiusKm"
              :placeholder="t('posts.filters.radiusPlaceholder')"
              @change="reload"
            />
          </div>

          <div class="filter-field">
            <label>{{ t('posts.filters.sortLabel') }}</label>
            <select v-model="filters.sort" @change="reload">
              <option value="date">{{ t('posts.filters.sortDate') }}</option>
              <option value="proximity" :disabled="!filters.near">{{ t('posts.filters.sortProximity') }}</option>
            </select>
          </div>
        </template>
      </div>

      <button type="button" class="btn btn-ghost btn-sm mt-2" @click="resetFilters">{{ t('posts.filters.reset') }}</button>
    </div>

    <div v-if="store.loading" class="state-center mt-4"><div class="spinner"></div></div>

    <div v-else-if="!store.feed.length" class="state-center mt-4">
      <div style="font-size:3rem; display:flex; justify-content:center"><Newspaper :size="48" /></div>
      <h3>{{ t('posts.feed.empty.title') }}</h3>
      <p class="text-muted mt-1">{{ t('posts.feed.empty.text') }}</p>
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
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Newspaper, CalendarDays, MapPin, X, Plus, Filter, ChevronDown } from 'lucide-vue-next'
import { usePostStore } from '../stores/posts.js'
import { useAuthStore } from '../stores/auth.js'
import { useUserStore } from '../stores/users.js'
import PostForm from '../components/post/PostForm.vue'
import PostCard from '../components/post/PostCard.vue'

const { t } = useI18n()
const store = usePostStore()
const auth  = useAuthStore()
const userStore = useUserStore()

const tab = ref('post')
const showForm = ref(false)
const showFilters = ref(false)
const filters = reactive({
  visibility: '',
  dateFrom: '',
  dateTo: '',
  author: '',
  near: '',
  radiusKm: '',
  sort: 'date'
})

const authorQuery    = ref('')
const selectedAuthor = ref(null)
const userResults    = ref([])
const locating       = ref(false)
let authorSearchTimer = null

function buildParams() {
  const params = { type: tab.value }
  if (filters.visibility) params.visibility = filters.visibility
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.author) params.author = filters.author
  if (tab.value === 'event') {
    if (filters.near) params.near = filters.near
    if (filters.near && filters.radiusKm) params.radiusKm = filters.radiusKm
    params.sort = filters.sort
  }
  return params
}

function reload() { store.fetchPosts(buildParams()) }

function setTab(value) {
  tab.value = value
  if (value === 'post') { filters.near = ''; filters.radiusKm = ''; filters.sort = 'date' }
  reload()
}

function onAuthorSearch() {
  clearTimeout(authorSearchTimer)
  authorSearchTimer = setTimeout(async () => {
    userResults.value = await userStore.searchUsers(authorQuery.value)
  }, 300)
}

function pickAuthor(u) {
  selectedAuthor.value = u
  filters.author = u._id
  authorQuery.value = ''
  userResults.value = []
  reload()
}

function clearAuthor() {
  selectedAuthor.value = null
  filters.author = ''
  reload()
}

function useMyLocation() {
  if (!navigator.geolocation) return
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = parseFloat(pos.coords.latitude.toFixed(6))
      const lng = parseFloat(pos.coords.longitude.toFixed(6))
      filters.near = `${lat},${lng}`
      locating.value = false
      reload()
    },
    err => { locating.value = false; console.warn('GPS error', err) },
    { timeout: 10000, enableHighAccuracy: true }
  )
}

function resetFilters() {
  filters.visibility = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.author = ''
  filters.near = ''
  filters.radiusKm = ''
  filters.sort = 'date'
  selectedAuthor.value = null
  authorQuery.value = ''
  userResults.value = []
  reload()
}

onMounted(() => {
  reload()
  store.markSeen('feed')
})

function onCreated() { showForm.value = false; reload() }
async function onDelete(post) { await store.deletePost(post._id) }
async function onCloseEvent(post) { await store.setEventStatus(post._id, 'closed') }
async function onRespond(post, message) { await store.respond(post._id, message) }
async function onLike(post) { await store.toggleLike(post._id, auth.user?._id) }
async function onComment(post, message) { await store.addComment(post._id, message) }
async function onDeleteComment(post, comment) { await store.deleteComment(post._id, comment._id) }
async function onAttend(post, status, guests) { await store.setAttendance(post._id, status, guests) }
</script>

<style scoped>
.page-header { @apply flex items-center justify-between mb-6; }
.tabs-row    { @apply flex items-center gap-2 border-b border-border; }
.tabs        { @apply flex gap-5; }
.posts-list  { @apply flex flex-col gap-4; }

.tab-btn {
  @apply inline-flex items-center gap-1.5 text-sm font-medium text-muted bg-transparent border-none
         border-b-2 border-transparent cursor-pointer px-1 py-2.5 -mb-px transition-colors;
}
.tab-btn:hover { @apply text-foam; }
.tab-btn.active { @apply text-ocean border-ocean; }

.post-form-wrap { @apply mt-4; }

.section-separator { @apply border-t border-border my-4; }

.page-desc { @apply text-sm text-muted mt-1; }

.filters-toggle {
  @apply inline-flex items-center gap-2 text-sm font-medium text-foam bg-transparent border-none
         cursor-pointer px-0 py-3 transition-colors;
}
.filters-toggle:hover { @apply text-ocean; }
.filters-toggle .chevron { @apply text-muted transition-transform duration-200; }
.filters-toggle .chevron.open { transform: rotate(180deg); }

.filters-panel { @apply flex flex-col gap-3 pb-4 border-b border-border; }
.filters-desc  { @apply text-sm text-muted; }

.filters-grid { @apply flex flex-wrap items-end gap-4; }

.filter-field { @apply flex flex-col gap-1.5; }
.filter-field label { @apply text-xs font-medium text-muted; }
.filter-field select,
.filter-field input[type="date"],
.filter-field input[type="number"],
.filter-field input[type="text"] { @apply text-sm w-auto; }

.author-filter  { @apply relative; }
.author-filter input { @apply text-sm; }
.chip {
  @apply inline-flex items-center gap-1.5 text-xs bg-surface-2 border border-border rounded-full px-3 py-1.5;
}
.chip button { @apply bg-transparent border-none cursor-pointer text-muted flex items-center; }

.author-results {
  @apply absolute top-full left-0 mt-1 flex flex-col bg-surface-2 border border-border rounded-sm
         shadow-lg z-10 min-w-[180px] max-h-48 overflow-y-auto;
}
.author-result-row {
  @apply text-sm text-left bg-transparent border-none cursor-pointer px-3 py-2 hover:bg-surface;
}
</style>
