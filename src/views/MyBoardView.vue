<template>
  <div>
    <div class="page-header">
      <h2>{{ t('posts.board.titlePrefix') }} <span class="text-ocean">{{ t('posts.board.titleHighlight') }}</span></h2>
    </div>

    <PostForm :create-fn="store.createPost" @created="onCreated" />

    <div v-if="store.loading" class="state-center mt-4"><div class="spinner"></div></div>

    <div v-else-if="!myPosts.length" class="state-center mt-4">
      <div style="font-size:3rem; display:flex; justify-content:center"><Pin :size="48" /></div>
      <h3>{{ t('posts.board.empty.title') }}</h3>
      <p class="text-muted mt-1">{{ t('posts.board.empty.text') }}</p>
    </div>

    <div v-else class="posts-list mt-4">
      <PostCard
        v-for="p in myPosts"
        :key="p._id"
        :post="p"
        @delete="onDelete"
        @close-event="onCloseEvent"
        @respond="onRespond"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Pin } from 'lucide-vue-next'
import { usePostStore } from '../stores/posts.js'
import { useAuthStore } from '../stores/auth.js'
import PostForm from '../components/post/PostForm.vue'
import PostCard from '../components/post/PostCard.vue'

const { t } = useI18n()
const store = usePostStore()
const auth  = useAuthStore()

const myPosts = computed(() => store.feed)

onMounted(() => {
  store.fetchPosts({ author: auth.user?._id })
  store.markSeen('board')
})

function onCreated() { store.fetchPosts({ author: auth.user?._id }) }
async function onDelete(post) { await store.deletePost(post._id) }
async function onCloseEvent(post) { await store.setEventStatus(post._id, 'closed') }
async function onRespond(post, message) { await store.respond(post._id, message); await store.fetchPosts({ author: auth.user?._id }) }
</script>

<style scoped>
.page-header { @apply flex items-center justify-between mb-6; }
.posts-list  { @apply flex flex-col gap-4; }
</style>
