<template>
  <div>
    <div class="page-header">
      <RouterLink to="/market" class="btn btn-ghost btn-sm">{{ t('common.back') }}</RouterLink>
    </div>

    <div v-if="loading" class="state-center"><div class="spinner"></div></div>

    <div v-else-if="!shop" class="state-center">
      <p class="text-muted">{{ t('market.shops.notFound') }}</p>
    </div>

    <template v-else>
      <div class="card shop-head">
        <img v-if="shop.avatar" :src="shop.avatar" class="avatar" />
        <span v-else class="avatar-placeholder">{{ initials }}</span>
        <div class="min-w-0">
          <h2 class="truncate">{{ shop.name || shop.displayName }}</h2>
          <p v-if="shop.name" class="text-muted text-sm truncate">{{ shop.displayName }}</p>
          <p v-if="shop.description" class="text-muted text-sm mt-2">{{ shop.description }}</p>
        </div>
      </div>

      <div v-if="!listings.length" class="market-empty">
        <Package :size="20" />
        <p>{{ t('market.shops.emptyListings') }}</p>
      </div>
      <div v-else class="listings-grid mt-4">
        <ListingCard v-for="l in listings" :key="l._id" :listing="l" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Package } from 'lucide-vue-next'
import { useMarketStore } from '../stores/market.js'
import ListingCard from '../components/market/ListingCard.vue'

const { t } = useI18n()
const route = useRoute()
const store = useMarketStore()

const shop     = ref(null)
const listings = ref([])
const loading  = ref(true)

const initials = computed(() => {
  const name = shop.value?.name || shop.value?.displayName || '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

async function load() {
  loading.value = true
  shop.value = null
  try {
    const data = await store.fetchShop(route.params.userId)
    shop.value = data.shop
    listings.value = data.listings
  } catch {
    shop.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.userId, load)
onMounted(load)
</script>

<style scoped>
.page-header { @apply mb-4; }
.shop-head { @apply flex items-start gap-3; }

.avatar { @apply w-16 h-16 rounded-full object-cover shrink-0; }
.avatar-placeholder {
  @apply w-16 h-16 shrink-0 rounded-full border border-ocean text-ocean flex items-center
         justify-center text-lg font-bold;
  background: var(--ocean-glow);
}

.listings-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.market-empty {
  @apply flex items-center justify-center gap-2 text-muted text-sm py-8;
}
</style>
