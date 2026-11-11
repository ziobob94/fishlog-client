<template>
  <div>
    <PageHeader :title="t('posts.detail.title')" back compact />
    <div v-if="store.loading && !post" class="state-center"><div class="spinner"></div></div>
    <div v-else-if="!post" class="state-center mt-4" role="alert">
      <h3>{{ t('posts.detail.notFound') }}</h3>
    </div>
    <PostCard
      v-else
      :post="post"
      @delete="onDelete"
      @close-event="p => store.setEventStatus(p._id, 'closed')"
      @respond="(p, m) => store.respond(p._id, m)"
      @like="p => store.toggleLike(p._id, auth.user?._id)"
      @save="p => store.toggleSave(p._id)"
      @comment="(p, m) => store.addComment(p._id, m)"
      @delete-comment="(p, c) => store.deleteComment(p._id, c._id)"
      @attend="(p, s, g) => store.setAttendance(p._id, s, g)"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '../components/PageHeader.vue'
import PostCard from '../components/post/PostCard.vue'
import { usePostStore } from '../stores/posts.js'
import { useAuthStore } from '../stores/auth.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = usePostStore()
const auth = useAuthStore()
const post = computed(() => (store.current?._id === route.params.id ? store.current : null))

onMounted(() => { store.current = null; store.fetchPost(route.params.id) })
async function onDelete(p) { await store.deletePost(p._id); router.back() }
</script>
