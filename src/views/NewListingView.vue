<template>
  <div>
    <div class="page-header">
      <h2>{{ t('market.newListing') }}</h2>
    </div>
    <ListingForm
      :categories="store.categories"
      :submit-label="t('market.form.publish')"
      :saving="saving"
      :error="error"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMarketStore } from '../stores/market.js'
import ListingForm from '../components/market/ListingForm.vue'

const { t } = useI18n()
const router = useRouter()
const store = useMarketStore()

const saving = ref(false)
const error  = ref('')

async function onSubmit(payload, files) {
  error.value = ''
  saving.value = true
  try {
    const listing = await store.createListing(payload)
    if (files.length) await store.uploadMedia(listing._id, files)
    router.push(`/market/${listing._id}`)
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error')
  } finally { saving.value = false }
}

onMounted(() => store.fetchCategories())
</script>
