<template>
  <div>
    <div class="market-toolbar">
      <div class="tabs" role="tablist">
        <button
          type="button" role="tab" :aria-selected="tab === 'listings'"
          class="tab-pill" :class="{ active: tab === 'listings' }" @click="tab = 'listings'"
        ><Package :size="14" /> {{ t('market.tabs.listings') }}</button>
        <button
          type="button" role="tab" :aria-selected="tab === 'shops'"
          class="tab-pill" :class="{ active: tab === 'shops' }" @click="tab = 'shops'"
        ><Store :size="14" /> {{ t('market.tabs.shops') }}</button>
        <button
          type="button" role="tab" :aria-selected="tab === 'ebay'"
          class="tab-pill" :class="{ active: tab === 'ebay' }" @click="tab = 'ebay'"
        ><Globe :size="14" /> {{ t('market.tabs.ebay') }}</button>
      </div>

      <button
        v-if="tab === 'listings' || tab === 'ebay'"
        type="button" class="btn btn-ghost btn-sm" :class="{ 'btn-toggle-active': showFilters }"
        :aria-pressed="showFilters" @click="showFilters = !showFilters"
      >
        <Filter :size="14" /> {{ t('market.filters.title') }}
        <span v-if="activeFilterCount" class="filter-count-badge">{{ activeFilterCount }}</span>
      </button>
    </div>

    <!-- Tab Annunci: solo venditori privati, le vetrine dei negozi hanno una
         tab propria per non mescolare due modi diversi di sfogliare. -->
    <template v-if="tab === 'listings'">
      <ListingFilters v-if="showFilters" v-model="filters" :categories="store.categories" :show-seller-type="false" @reset="resetFilters" />

      <div v-if="listingsInfiniteLoading" class="state-center">
        <div class="spinner"></div>
      </div>

      <div v-else-if="!store.listings.length" class="market-empty">
        <Package :size="20" />
        <p>{{ t('market.empty.text') }}</p>
      </div>

      <div v-else class="listings-grid">
        <ListingCard v-for="l in store.listings" :key="l._id" :listing="l" />
      </div>

      <InfiniteSentinel :active="listingsHasMore" :loading="listingsLoadingMore" @trigger="listingsLoadMore" />
    </template>

    <!-- Tab Negozi: elenco delle vetrine verificate, separato dagli annunci
         perché qui si sfoglia per venditore invece che per articolo. -->
    <template v-else-if="tab === 'shops'">
      <input
        v-model="shopSearch" type="search" :placeholder="t('market.shops.searchPlaceholder')"
        class="shop-search mb-4"
      />

      <div v-if="shopsInfiniteLoading" class="state-center">
        <div class="spinner"></div>
      </div>

      <div v-else-if="!store.shops.length" class="market-empty">
        <Store :size="20" />
        <p>{{ t('market.shops.empty') }}</p>
      </div>

      <div v-else class="shops-grid">
        <ShopCard v-for="s in store.shops" :key="s._id" :shop="s" />
      </div>

      <InfiniteSentinel :active="shopsHasMore" :loading="shopsLoadingMore" @trigger="shopsLoadMore" />
    </template>

    <!-- Tab eBay: annunci dal marketplace eBay IT, con paginazione e filtri
         propri (l'architettura è pronta per aggiungere altre fonti esterne
         in futuro, per ora solo eBay). -->
    <template v-else>
      <ListingFilters
        v-if="showFilters" v-model="ebayFilters" :categories="store.categories"
        :show-seller-type="false" :show-location="false" @reset="resetEbayFilters"
      />

      <div v-if="ebayInfiniteLoading" class="state-center">
        <div class="spinner"></div>
      </div>

      <div v-else-if="!store.external.length" class="market-empty">
        <Globe :size="20" />
        <p>{{ store.externalConfigured ? t('market.external.empty') : t('market.external.notConfigured') }}</p>
      </div>

      <div v-else class="listings-grid">
        <ExternalListingCard v-for="(l, i) in store.external" :key="`e-${i}`" :listing="l" />
      </div>

      <InfiniteSentinel :active="ebayHasMore" :loading="ebayLoadingMore" @trigger="ebayLoadMore" />

      <!-- Diagnostica eBay, solo per admin. -->
      <p v-if="auth.user?.role === 'admin' && store.externalError" class="external-admin-hint external-admin-error text-sm mt-2">
        {{ t('market.external.adminError', { error: store.externalError }) }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Package, Filter, Store, Globe } from 'lucide-vue-next'
import { useMarketStore } from '../stores/market.js'
import { useAuthStore } from '../stores/auth.js'
import { useInfiniteScroll } from '../composables/useInfiniteScroll.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'
import ListingCard         from '../components/market/ListingCard.vue'
import ListingFilters      from '../components/market/ListingFilters.vue'
import ExternalListingCard from '../components/market/ExternalListingCard.vue'
import ShopCard            from '../components/market/ShopCard.vue'
import InfiniteSentinel    from '../components/InfiniteSentinel.vue'

const { t } = useI18n()
const store = useMarketStore()
const auth  = useAuthStore()

const tab = ref('listings')
const showFilters = ref(false)
const zip = ref('')

const activeFilterCount = computed(() => {
  const source = tab.value === 'ebay' ? ebayFilters.value : filters.value
  return Object.values(source).filter(v => v).length
})

// ── tab Annunci (venditori privati) ──
const filters = ref({ search: '', category: '', condition: '', location: '', priceMin: '', priceMax: '' })
const {
  loading: listingsInfiniteLoading, loadingMore: listingsLoadingMore,
  hasMore: listingsHasMore, reset: listingsReset, loadMore: listingsLoadMore
} = useInfiniteScroll(
  (page, { append }) => store.fetchListings({
    page,
    search:    filters.value.search    || undefined,
    category:  filters.value.category  || undefined,
    condition: filters.value.condition || undefined,
    location:  filters.value.location  || undefined,
    priceMin:  filters.value.priceMin  || undefined,
    priceMax:  filters.value.priceMax  || undefined
  }, { append }),
  computed(() => store.pagination.pages)
)
const debouncedListingsReset = useDebouncedFn(() => listingsReset(), 320)
watch(filters, debouncedListingsReset, { deep: true })

function resetFilters() {
  filters.value = { search: '', category: '', condition: '', location: '', priceMin: '', priceMax: '' }
  listingsReset()
}

// ── tab Negozi ──
const shopSearch = ref('')
const { loading: shopsInfiniteLoading, loadingMore: shopsLoadingMore, hasMore: shopsHasMore, reset: shopsReset, loadMore: shopsLoadMore } = useInfiniteScroll(
  (page, { append }) => store.fetchShops({ page, search: shopSearch.value || undefined }, { append }),
  computed(() => store.shopsPagination.pages)
)
const debouncedShopsReset = useDebouncedFn(() => shopsReset(), 320)
watch(shopSearch, debouncedShopsReset)

// ── tab eBay ──
const ebayFilters = ref({ search: '', category: '', condition: '', priceMin: '', priceMax: '' })
const { loading: ebayInfiniteLoading, loadingMore: ebayLoadingMore, hasMore: ebayHasMore, reset: ebayReset, loadMore: ebayLoadMore } = useInfiniteScroll(
  (page, { append }) => store.fetchExternal({
    page,
    search:    ebayFilters.value.search    || undefined,
    category:  ebayFilters.value.category  || undefined,
    condition: ebayFilters.value.condition || undefined,
    priceMin:  ebayFilters.value.priceMin  || undefined,
    priceMax:  ebayFilters.value.priceMax  || undefined,
    zip:       zip.value                   || undefined
  }, { append }),
  computed(() => store.externalPagination.pages)
)
const debouncedEbayReset = useDebouncedFn(() => ebayReset(), 320)
watch(ebayFilters, debouncedEbayReset, { deep: true })

function resetEbayFilters() {
  ebayFilters.value = { search: '', category: '', condition: '', priceMin: '', priceMax: '' }
  ebayReset()
}

// Caricati solo alla prima apertura della tab, non al mount della pagina:
// la maggior parte delle visite al market resta sugli annunci.
watch(tab, (value) => {
  if (value === 'shops' && !store.shops.length) shopsReset()
  if (value === 'ebay' && !store.external.length) ebayReset()
})

// Codice postale via geolocalizzazione, solo per stimare meglio le spese di
// consegna nei risultati eBay: se l'utente nega il permesso, niente male,
// la ricerca esterna funziona comunque senza (solo meno "localizzata"). Se
// la tab eBay non è ancora stata aperta userà comunque lo zip alla prima
// apertura, quindi qui basta aggiornare i risultati già caricati.
function detectZip() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude, longitude } = pos.coords
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=it`)
      const data = await res.json()
      if (data.address?.postcode) {
        zip.value = data.address.postcode
        if (store.external.length) ebayReset()
      }
    } catch { /* nessun blocco: la ricerca esterna funziona anche senza zip */ }
  }, () => {}, { timeout: 5000 })
}

onMounted(() => {
  store.fetchCategories()
  listingsReset()
  detectZip()
})
</script>

<style scoped>
.market-toolbar { @apply flex items-center justify-between gap-2 mb-4 flex-wrap; }

.tabs {
  @apply flex gap-1 p-1 bg-surface-2 rounded-full w-full sm:w-auto;
}
.tab-pill {
  @apply flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted bg-transparent border-none rounded-full cursor-pointer px-3 py-1.5 transition-colors whitespace-nowrap;
}
.tab-pill:hover { @apply text-foam; }
.tab-pill.active { @apply text-ink bg-ocean; }

.btn-toggle-active {
  @apply text-ocean bg-ocean/10;
}

.filter-count-badge {
  @apply inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-ocean text-white text-[0.65rem] font-bold px-1;
}

.listings-grid, .shops-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.shop-search { @apply max-w-xs; }

.market-empty {
  @apply flex items-center justify-center gap-2 text-muted text-sm py-8;
}

.external-admin-hint { @apply text-muted; }
.external-admin-error { @apply text-danger; }
</style>
