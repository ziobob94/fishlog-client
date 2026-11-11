<template>
  <div class="post-compose">
    <PageHeader :title="t('posts.form.pageTitle')" back close-icon compact>
      <button type="submit" form="post-compose-form" class="fl-btn1 head-submit" :disabled="st.saving">
        {{ st.saving ? (st.progress ? t('posts.form.savingPct', { n: st.progress }) : t('posts.form.saving')) : t('posts.form.submit') }}
      </button>
    </PageHeader>
    <PostForm form-id="post-compose-form" hide-submit :create-fn="store.createPost" :initial-type="route.query.type === 'event' ? 'event' : 'post'" @created="onCreated" @state="s => st = s" />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '../components/PageHeader.vue'
import PostForm from '../components/post/PostForm.vue'
import { usePostStore } from '../stores/posts.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = usePostStore()
const st = ref({ saving: false, progress: 0 })

// Dopo la pubblicazione si torna da dove si è partiti (Community o Il mio profilo).
function onCreated() { router.replace(route.query.from === 'board' ? '/board' : '/feed') }
</script>

<style scoped>
.post-compose { max-width: 640px; padding-bottom: calc(24px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 4px; }
.head-submit { width: auto; min-height: 44px; padding: 0 20px; font-size: 15px; border-radius: 14px; }
</style>
