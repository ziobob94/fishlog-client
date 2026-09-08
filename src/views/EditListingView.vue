<template>
  <div v-if="store.current">
    <div class="page-header">
      <h2>{{ t('market.form.edit') }}</h2>
    </div>
    <ListingForm
      :initial="store.current"
      :categories="store.categories"
      :submit-label="t('common.save')"
      :saving="saving"
      :error="error"
      @submit="onSubmit"
      @remove-media="onRemoveMedia"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMarketStore } from '../stores/market.js'
import ListingForm from '../components/market/ListingForm.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useMarketStore()

const saving = ref(false)
const error  = ref('')

async function onSubmit(payload, files) {
  error.value = ''
  saving.value = true
  try {
    await store.updateListing(route.params.id, payload)
    if (files.length) await store.uploadMedia(route.params.id, files)
    router.push(`/market/${route.params.id}`)
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error')
  } finally { saving.value = false }
}

async function onRemoveMedia(mediaId) {
  await store.deleteMedia(route.params.id, mediaId)
  await store.fetchListing(route.params.id)
}

onMounted(async () => {
  store.fetchCategories()
  await store.fetchListing(route.params.id)
})
</script>
