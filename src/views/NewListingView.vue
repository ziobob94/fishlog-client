<template>
  <div v-if="!verified" class="gate">
    <h2>{{ t('seller.gate.title') }}</h2>
    <p class="text-muted">{{ t('seller.gate.text') }}</p>
    <RouterLink to="/market/sell" class="btn btn-primary mt-3">{{ t('seller.becomeSeller') }}</RouterLink>
  </div>
  <div v-else>
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
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMarketStore } from '../stores/market.js'
import { useAuthStore } from '../stores/auth.js'
import ListingForm from '../components/market/ListingForm.vue'

const { t } = useI18n()
const router = useRouter()
const store = useMarketStore()
const auth = useAuthStore()
const verified = computed(() => auth.user?.shop?.verificationStatus === 'verified')

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

<style scoped>
.gate { @apply max-w-md mx-auto text-center py-12 flex flex-col items-center gap-2; }
</style>
