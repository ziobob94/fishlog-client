<template>
  <div>
    <PostForm :create-fn="store.createPost" @created="onCreated" />

    <div v-if="infiniteLoading" class="state-center mt-4"><div class="spinner"></div></div>

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
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Pin } from 'lucide-vue-next'
import { usePostStore } from '../stores/posts.js'
import { useAuthStore } from '../stores/auth.js'
import { useInfiniteScroll } from '../composables/useInfiniteScroll.js'
import PostForm from '../components/post/PostForm.vue'
import PostCard from '../components/post/PostCard.vue'
import InfiniteSentinel from '../components/InfiniteSentinel.vue'

const { t } = useI18n()
const store = usePostStore()
const auth  = useAuthStore()

const pagesRef = computed(() => store.pagination.pages)
const { loading: infiniteLoading, loadingMore, hasMore, reset, loadMore } = useInfiniteScroll(
  (page, { append }) => store.fetchPosts({ author: auth.user?._id, page }, { append }),
  pagesRef
)

onMounted(() => {
  reset()
  store.markSeen('board')
})

function onCreated() { reset() }
async function onDelete(post) { await store.deletePost(post._id) }
async function onCloseEvent(post) { await store.setEventStatus(post._id, 'closed') }
async function onRespond(post, message) { await store.respond(post._id, message) }
async function onLike(post) { await store.toggleLike(post._id, auth.user?._id) }
async function onComment(post, message) { await store.addComment(post._id, message) }
async function onDeleteComment(post, comment) { await store.deleteComment(post._id, comment._id) }
async function onAttend(post, status, guests) { await store.setAttendance(post._id, status, guests) }
</script>

<style scoped>
.posts-list  { @apply flex flex-col gap-4; }
.posts-list > :last-child :deep(.post-card) { @apply border-b-0 pb-0; }
</style>
