<template>
  <div>
    <div class="feed-toolbar">
      <div class="tabs" role="tablist">
        <button
          type="button" role="tab" :aria-selected="tab === 'post'"
          class="tab-pill" :class="{ active: tab === 'post' }"
          @click="setTab('post')"
        ><Newspaper :size="14" /> {{ t('posts.tabs.posts') }}</button>
        <button
          type="button" role="tab" :aria-selected="tab === 'event'"
          class="tab-pill" :class="{ active: tab === 'event' }"
          @click="setTab('event')"
        ><CalendarDays :size="14" /> {{ t('posts.tabs.events') }}</button>
      </div>
      <div class="toolbar-actions">
        <button
          type="button" class="icon-btn" :class="{ active: showFilters }"
          :title="t('posts.filters.title')" :aria-pressed="showFilters"
          @click="showFilters = !showFilters; showForm = false"
        ><Filter :size="17" /></button>
        <button
          type="button" class="icon-btn" :class="{ active: showForm }"
          :title="showForm ? t('posts.feed.hideForm') : t('posts.feed.newPost')" :aria-pressed="showForm"
          @click="showForm = !showForm; showFilters = false"
        ><Plus :size="18" /></button>
      </div>
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
  import { onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { Newspaper, CalendarDays, MapPin, Map as MapIcon, X, Plus, Filter } from 'lucide-vue-next'
  import { usePostStore } from '../stores/posts.js'
  import { useAuthStore } from '../stores/auth.js'
  import { useUserStore } from '../stores/users.js'
  import PostForm from '../components/post/PostForm.vue'
  import PostCard from '../components/post/PostCard.vue'
  import LocationPicker from '../components/form/LocationPicker.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const store = usePostStore()
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

  function reload() { store.fetchPosts(buildParams()) }

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

    // Arrivo dal menu "Crea nuovo" della topbar: apre subito il form.
    if (route.query.compose) {
      showForm.value = true
      router.replace({ query: { ...route.query, compose: undefined } })
    }
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
  .feed-toolbar {
    @apply flex items-center justify-between gap-2;
  }

  .tabs {
    @apply flex gap-1 p-1 bg-surface-2 rounded-full;
  }

  .posts-list {
    @apply flex flex-col gap-4;
  }

  .posts-list > :last-child :deep(.post-card) {
    @apply border-b-0 pb-0;
  }

  .tab-pill {
    @apply inline-flex items-center gap-1.5 text-xs font-semibold text-muted bg-transparent border-none rounded-full cursor-pointer px-3 py-1.5 transition-colors;
  }

  .tab-pill:hover {
    @apply text-foam;
  }

  .tab-pill.active {
    @apply text-ink bg-ocean;
  }

  .toolbar-actions {
    @apply flex items-center gap-1;
  }

  .icon-btn {
    @apply flex items-center justify-center w-8 h-8 rounded-lg text-muted bg-transparent border-none cursor-pointer transition-colors;
  }

  .icon-btn:hover {
    @apply text-foam bg-surface-2;
  }

  .icon-btn.active {
    @apply text-ocean bg-ocean/10;
  }

  .post-form-wrap {
    @apply mt-3;
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
