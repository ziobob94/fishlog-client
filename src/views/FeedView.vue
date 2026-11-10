<template>
  <div>
    <PageHeader :title="t('nav.community')" bell>
      <RouterLink to="/chat" class="ph-icon" :title="t('nav.chat')" :aria-label="t('nav.chat')">
        <AppIcon name="invia" :size="16" />
        <span v-if="chat.unreadCount" class="ph-count">{{ chat.unreadCount }}</span>
      </RouterLink>
      <button
        type="button" class="ph-icon" :class="{ active: showFilters }"
        :title="t('posts.filters.title')" :aria-pressed="showFilters"
        @click="showFilters = !showFilters"
      ><Filter :size="16" /></button>
    </PageHeader>

    <div class="chips" role="tablist">
      <button
        type="button" role="tab" :aria-selected="tab === 'post'"
        class="chip" :class="{ active: tab === 'post' }" @click="setTab('post')"
      >{{ t('posts.tabs.forYou') }}</button>
      <button
        type="button" role="tab" :aria-selected="tab === 'event'"
        class="chip" :class="{ active: tab === 'event' }" @click="setTab('event')"
      >{{ t('posts.tabs.events') }}</button>
    </div>

    <template v-if="showForm">
      <div class="post-form-wrap">
        <PostForm :create-fn="store.createPost" :initial-type="tab" @created="onCreated" />
      </div>
      <div class="section-separator"></div>
    </template>

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
          <label>{{ t('posts.filters.dateRangeLabel') }}</label>
          <div class="date-range">
            <input type="date" v-model="filters.dateFrom" :title="t('posts.filters.dateFrom')" @change="reload" />
            <span class="date-range-sep">{{ t('posts.filters.dateRangeSep') }}</span>
            <input type="date" v-model="filters.dateTo" :title="t('posts.filters.dateTo')" @change="reload" />
          </div>
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
            <div class="location-buttons">
              <button type="button" class="btn btn-ghost btn-sm" :disabled="locating" @click="useMyLocation">
                <MapPin :size="14" /> {{ t('posts.filters.useMyLocation') }}
              </button>
              <button type="button" class="btn btn-ghost btn-sm" @click="showLocationPicker = !showLocationPicker">
                <MapIcon :size="14" /> {{ t('posts.filters.pickOnMap') }}
              </button>
              <span v-if="filters.near" class="chip">
                {{ t('posts.filters.locationSet') }}
                <button type="button" @click="clearLocation"><X :size="12" /></button>
              </span>
            </div>
          </div>

          <div v-if="filters.near" class="filter-field radius-field">
            <label>{{ t('posts.filters.radiusLabel') }}: <strong>{{ filters.radiusKm }} km</strong></label>
            <input
              type="range"
              min="1"
              max="200"
              step="1"
              v-model.number="filters.radiusKm"
              @change="reload"
            />
          </div>
        </template>
      </div>

      <div v-if="tab === 'event' && showLocationPicker" class="location-picker-wrap">
        <p class="filters-desc">{{ t('posts.filters.pickOnMapHint') }}</p>
        <LocationPicker
          :lat="pickerLat"
          :lng="pickerLng"
          :name="pickerName"
          :name-placeholder="t('posts.filters.searchLocationPlaceholder')"
          @update:lat="onPickLat"
          @update:lng="onPickLng"
          @update:name="v => pickerName = v"
        />
      </div>

      <div v-if="tab === 'event'" class="filter-field sort-field">
        <label>{{ t('posts.filters.sortLabel') }}</label>
        <select v-model="filters.sort" @change="reload">
          <option value="date">{{ t('posts.filters.sortDate') }}</option>
          <option value="proximity" :disabled="!filters.near">{{ t('posts.filters.sortProximity') }}</option>
        </select>
      </div>

      <button type="button" class="btn btn-ghost btn-sm mt-2" @click="resetFilters">{{ t('posts.filters.reset') }}</button>
    </div>

    <div class="section-separator"></div>

    <div v-if="infiniteLoading" class="state-center mt-4"><div class="spinner"></div></div>

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
      <InfiniteSentinel :active="hasMore" :loading="loadingMore" @trigger="loadMore" />
    </div>
  </div>
</template>

<script setup>
import PageHeader from '../components/PageHeader.vue'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { Newspaper, MapPin, Map as MapIcon, X, Filter } from 'lucide-vue-next'
  import { usePostStore } from '../stores/posts.js'
  import { useChatStore } from '../stores/chat.js'
  import AppIcon from '../components/AppIcon.vue'
  import { useAuthStore } from '../stores/auth.js'
  import { useUserStore } from '../stores/users.js'
  import { useInfiniteScroll } from '../composables/useInfiniteScroll.js'
  import PostForm from '../components/post/PostForm.vue'
  import PostCard from '../components/post/PostCard.vue'
  import LocationPicker from '../components/form/LocationPicker.vue'
  import InfiniteSentinel from '../components/InfiniteSentinel.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const store = usePostStore()
  const chat = useChatStore()
  const auth = useAuthStore()
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
    radiusKm: 25,
    sort: 'date'
  })

  const authorQuery = ref('')
  const selectedAuthor = ref(null)
  const userResults = ref([])
  const locating = ref(false)
  let authorSearchTimer = null

  const showLocationPicker = ref(false)
  const pickerLat = ref(null)
  const pickerLng = ref(null)
  const pickerName = ref('')
  let pickCommitTimer = null

  watch(() => filters.near, (value) => {
    if (!value) { pickerLat.value = null; pickerLng.value = null; pickerName.value = ''; return }
    const [lat, lng] = value.split(',').map(Number)
    pickerLat.value = lat
    pickerLng.value = lng
  })

  function schedulePickCommit() {
    clearTimeout(pickCommitTimer)
    pickCommitTimer = setTimeout(() => {
      if (pickerLat.value != null && pickerLng.value != null) {
        filters.near = `${pickerLat.value},${pickerLng.value}`
        reload()
      }
    }, 0)
  }
  function onPickLat(v) { pickerLat.value = v; schedulePickCommit() }
  function onPickLng(v) { pickerLng.value = v; schedulePickCommit() }

  function clearLocation() {
    filters.near = ''
    showLocationPicker.value = false
    reload()
  }

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

  const pagesRef = computed(() => store.pagination.pages)
  const { loading: infiniteLoading, loadingMore, hasMore, reset, loadMore } = useInfiniteScroll(
    (page, { append }) => store.fetchPosts({ ...buildParams(), page }, { append }),
    pagesRef
  )

  function reload() { return reset() }

  function setTab(value) {
    tab.value = value
    if (value === 'post') {
      filters.near = ''
      filters.radiusKm = 25
      filters.sort = 'date'
      showLocationPicker.value = false
    }
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
    filters.radiusKm = 25
    filters.sort = 'date'
    selectedAuthor.value = null
    authorQuery.value = ''
    userResults.value = []
    showLocationPicker.value = false
    reload()
  }

  onMounted(() => {
    reload()
    store.markSeen('feed')
  })

  // Il tasto + della topbar, quando si è già su questa pagina, apre il form
  // tramite un cambio di query invece che con un evento diretto.
  watch(() => route.query.compose, (value) => {
    if (!value) return
    showForm.value = true
    router.replace({ query: { ...route.query, compose: undefined } })
  }, { immediate: true })

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
  .posts-list {
    @apply flex flex-col gap-3;
  }

  .chips { @apply flex gap-2 overflow-x-auto pb-1 mb-3; scrollbar-width: none; }
  .chips::-webkit-scrollbar { display: none; }
  .chip {
    @apply inline-flex items-center shrink-0 min-h-[40px] px-4 rounded-full border border-border bg-surface text-foam text-sm font-semibold cursor-pointer whitespace-nowrap;
  }
  .chip.active { @apply bg-ocean border-ocean text-on-primary; }

  .ph-icon {
    @apply relative flex items-center justify-center w-9 h-9 rounded-xl text-foam bg-surface border border-border cursor-pointer no-underline;
  }
  .ph-icon.active { @apply text-ocean-text border-ocean; }
  .ph-count {
    @apply absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-ocean text-on-primary text-[0.65rem] font-bold inline-flex items-center justify-center;
  }

  .post-form-wrap {
    @apply mt-3 bg-surface border border-border/60 rounded-lg p-3.5;
  }

  .section-separator {
    @apply border-t border-border my-3;
  }

  .filters-panel {
    @apply flex flex-col gap-3 pt-3 pb-1;
  }

  .filters-desc {
    @apply text-sm text-muted;
  }

  .filters-grid {
    @apply flex flex-wrap items-end gap-4;
  }

  .filter-field {
    @apply flex flex-col gap-1.5;
  }

  .filter-field label {
    @apply text-xs font-medium text-muted;
  }

  .filter-field select,
  .filter-field input[type="date"],
  .filter-field input[type="number"],
  .filter-field input[type="text"] {
    @apply text-sm w-auto;
  }

  .author-filter {
    @apply relative;
  }

  .author-filter input {
    @apply text-sm;
  }

  .chip {
    @apply inline-flex items-center gap-1.5 text-xs bg-surface-2 border border-border rounded-full px-3 py-1.5;
  }

  .chip button {
    @apply bg-transparent border-none cursor-pointer text-muted flex items-center;
  }

  .author-results {
    @apply absolute top-full left-0 mt-1 flex flex-col bg-surface-2 border border-border rounded-sm shadow-lg z-10 min-w-[180px] max-h-48 overflow-y-auto;
  }

  .author-result-row {
    @apply text-sm text-left bg-transparent border-none cursor-pointer px-3 py-2 hover:bg-surface;
  }

  .date-range {
    @apply flex items-center gap-2;
  }

  .date-range-sep {
    @apply text-xs text-muted;
  }

  .location-buttons {
    @apply flex items-center flex-wrap gap-2;
  }

  .radius-field {
    @apply min-w-[180px];
  }

  .radius-field input[type="range"] {
    @apply w-full;
  }

  .sort-field {
    @apply w-full;
  }

  .sort-field select {
    @apply w-auto;
  }

  .location-picker-wrap {
    @apply flex flex-col gap-2 mt-1;
  }
</style>
