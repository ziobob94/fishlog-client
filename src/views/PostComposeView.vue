<template>
  <div class="post-compose">
    <PageHeader :title="t('posts.form.pageTitle')" back compact />
    <PostForm :create-fn="store.createPost" :initial-type="route.query.type === 'event' ? 'event' : 'post'" @created="onCreated" />
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '../components/PageHeader.vue'
import PostForm from '../components/post/PostForm.vue'
import { usePostStore } from '../stores/posts.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = usePostStore()

function onCreated() { router.replace('/feed') }
</script>

<style scoped>
.post-compose { max-width: 640px; padding-bottom: calc(24px + env(safe-area-inset-bottom)); }
</style>
