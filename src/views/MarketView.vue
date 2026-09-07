<template>
  <div>
    <div class="home-hero">
      <div>
        <h2>{{ t('market.titlePrefix') }} <span class="text-ocean">{{ t('market.titleHighlight') }}</span></h2>
        <p class="text-muted mt-1">{{ t('market.listingsCount', { n: store.pagination.total }) }}</p>
      </div>
      <RouterLink to="/market/new" class="btn btn-primary">
        <Plus :size="16" /> {{ t('market.newListing') }}
      </RouterLink>
    </div>

    <ListingFilters v-model="filters" :categories="store.categories" @reset="resetFilters" />

    <div v-if="store.loading" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!store.listings.length" class="state-center">
      <div style="font-size:3.5rem; display:flex; justify-content:center"><Package :size="56" /></div>
      <h3>{{ t('market.empty.title') }}</h3>
      <p class="text-muted">{{ t('market.empty.text') }}</p>
    </div>

    <div v-else class="listings-grid">
      <ListingCard v-for="l in store.listings" :key="l._id" :listing="l" />
    </div>

    <PaginationBar :current="pagination.page.value" :pages="store.pagination.pages" @change="pagination.goTo" />

    <!-- Fallback: pochi/nessun annuncio interno → propone risultati simili da eBay -->
    <section v-if="!store.loading && store.listings.length < 4" class="external-section">
      <hr class="external-hr" />
      <h3 class="external-heading icon-inline"><ExternalLink :size="16" /> {{ t('market.external.title') }}</h3>
      <p class="text-muted text-sm mb-3">{{ t('market.external.hint') }}</p>

      <div v-if="store.externalLoading" class="state-center"><div class="spinner"></div></div>

      <p v-else-if="!store.externalConfigured" class="text-muted text-sm">
        {{ t('market.external.notConfigured') }}
      </p>

      <div v-else-if="store.external.length" class="listings-grid">
        <ExternalListingCard v-for="(l, i) in store.external" :key="i" :listing="l" />
      </div>

      <p v-else class="text-muted text-sm">{{ t('market.external.empty') }}</p>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Package, ExternalLink } from 'lucide-vue-next'
import { useMarketStore } from '../stores/market.js'
import { usePagination } from '../composables/usePagination.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'
import ListingCard         from '../components/market/ListingCard.vue'
import ListingFilters      from '../components/market/ListingFilters.vue'
import ExternalListingCard from '../components/market/ExternalListingCard.vue'
import PaginationBar       from '../components/PaginationBar.vue'

const { t } = useI18n()
const store = useMarketStore()

const filters = ref({ search: '', category: '', condition: '', sellerType: '', location: '', priceMin: '', priceMax: '' })
const zip = ref('')

async function fetchData(page) {
  await store.fetchListings({
    page,
    search:     filters.value.search     || undefined,
    category:   filters.value.category   || undefined,
    condition:  filters.value.condition  || undefined,
    sellerType: filters.value.sellerType || undefined,
    location:   filters.value.location   || undefined,
    priceMin:   filters.value.priceMin   || undefined,
    priceMax:   filters.value.priceMax   || undefined
  })
  if (store.pagination.total < 4) {
    store.fetchExternal({ search: filters.value.search || undefined, zip: zip.value || undefined })
  }
  return store.pagination.pages
}

const pagination = usePagination(fetchData)
const debouncedReset = useDebouncedFn(() => pagination.reset(), 320)

watch(filters, debouncedReset, { deep: true })

function resetFilters() {
  filters.value = { search: '', category: '', condition: '', sellerType: '', location: '', priceMin: '', priceMax: '' }
  pagination.reset()
}

// Codice postale via geolocalizzazione, solo per stimare meglio le spese di
// consegna nei risultati eBay: se l'utente nega il permesso, niente male,
// la ricerca esterna funziona comunque senza (solo meno "localizzata").
function detectZip() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude, longitude } = pos.coords
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=it`)
      const data = await res.json()
      if (data.address?.postcode) {
        zip.value = data.address.postcode
        if (store.pagination.total < 4) store.fetchExternal({ search: filters.value.search || undefined, zip: zip.value })
      }
    } catch { /* nessun blocco: la ricerca esterna funziona anche senza zip */ }
  }, () => {}, { timeout: 5000 })
}

onMounted(() => {
  store.fetchCategories()
  pagination.load()
  detectZip()
})
</script>

<style scoped>
.home-hero { @apply flex items-end justify-between mb-6; }
.listings-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.external-section { @apply mt-8; }
.external-hr { @apply border-border mb-6; }
.external-heading { @apply font-bold text-sm uppercase tracking-wide mb-1 text-sand; }
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }
</style>
