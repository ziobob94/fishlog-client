<template>
  <div>
    <div class="page-header">
      <h2>{{ t('posts.feed.titlePrefix') }} <span class="text-ocean">{{ t('posts.feed.titleHighlight') }}</span></h2>
    </div>

    <PostForm :create-fn="store.createPost" @created="onCreated" />

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
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Newspaper } from 'lucide-vue-next'
import { usePostStore } from '../stores/posts.js'
import PostForm from '../components/post/PostForm.vue'
import PostCard from '../components/post/PostCard.vue'

const { t } = useI18n()
const store = usePostStore()

onMounted(() => {
  store.fetchPosts()
  store.markSeen('feed')
})

function onCreated() { store.fetchPosts() }
async function onDelete(post) { await store.deletePost(post._id) }
async function onCloseEvent(post) { await store.setEventStatus(post._id, 'closed') }
async function onRespond(post, message) { await store.respond(post._id, message); await store.fetchPosts() }
</script>

<style scoped>
.page-header { @apply flex items-center justify-between mb-6; }
.posts-list  { @apply flex flex-col gap-4; }
</style>
