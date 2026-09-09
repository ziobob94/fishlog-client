<template>
  <div>
    <div class="market-toolbar">
      <button
        type="button" class="btn btn-ghost btn-sm" :class="{ 'btn-toggle-active': showFilters }"
        :aria-pressed="showFilters" @click="showFilters = !showFilters"
      >
        <Filter :size="14" /> {{ t('market.filters.title') }}
        <span v-if="activeFilterCount" class="filter-count-badge">{{ activeFilterCount }}</span>
      </button>
    </div>

    <ListingFilters v-if="showFilters" v-model="filters" :categories="store.categories" @reset="resetFilters" />

    <div v-if="showSpinner" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!allItems.length" class="market-empty">
      <Package :size="20" />
      <p>{{ t('market.empty.text') }}</p>
    </div>

    <!-- Un'unica vetrina: annunci fishlog (privati e negozi) e risultati eBay
         mescolati nella stessa griglia, ognuno etichettato dalla sua card
         (badge "Negozio" o "eBay") invece che separati in sezioni diverse. -->
    <div v-else class="listings-grid">
      <template v-for="item in allItems" :key="item.key">
        <ListingCard v-if="item.source === 'internal'" :listing="item.listing" />
        <ExternalListingCard v-else :listing="item.listing" />
      </template>
    </div>

    <InfiniteSentinel :active="hasMore" :loading="loadingMore" @trigger="loadMore" />

    <!-- Diagnostica eBay, solo per admin: non è mai un motivo per mostrare
         meno annunci agli utenti normali, quindi non compare per loro. -->
    <template v-if="auth.user?.role === 'admin'">
      <p v-if="showExternalNotConfiguredHint" class="external-admin-hint text-sm mt-3">
        {{ t('market.external.notConfigured') }}
      </p>
      <p v-if="store.externalError" class="external-admin-hint external-admin-error text-sm mt-2">
        {{ t('market.external.adminError', { error: store.externalError }) }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Package, Filter } from 'lucide-vue-next'
import { useMarketStore } from '../stores/market.js'
import { useAuthStore } from '../stores/auth.js'
import { useInfiniteScroll } from '../composables/useInfiniteScroll.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'
import ListingCard         from '../components/market/ListingCard.vue'
import ListingFilters      from '../components/market/ListingFilters.vue'
import ExternalListingCard from '../components/market/ExternalListingCard.vue'
import InfiniteSentinel    from '../components/InfiniteSentinel.vue'

const { t } = useI18n()
const store = useMarketStore()
const auth  = useAuthStore()

const filters = ref({ search: '', category: '', condition: '', sellerType: '', location: '', priceMin: '', priceMax: '' })
const zip = ref('')
const showFilters = ref(false)
const activeFilterCount = computed(() => Object.values(filters.value).filter(v => v).length)

// Il fallback eBay scatta solo quando il market interno è scarso (< 4
// annunci per questa ricerca): oltre quella soglia i risultati esterni,
// anche se già in cache da una ricerca precedente, non vanno mostrati.
const externalActive = computed(() => store.pagination.total < 4)

const allItems = computed(() => {
  const internal = store.listings.map(l => ({ key: `i-${l._id}`, source: 'internal', listing: l }))
  if (!externalActive.value) return internal
  const external = store.external.map((l, i) => ({ key: `e-${i}`, source: 'external', listing: l }))
  return [...internal, ...external]
})

// Mentre il fallback eBay è ancora in corso e non abbiamo ancora nulla da
// mostrare, resta lo spinner: evita di far comparire per un istante "nessun
// annuncio" salvo poi sostituirlo con la griglia appena eBay risponde.
const externalPending = computed(() => externalActive.value && store.externalLoading)
const showSpinner = computed(() => infiniteLoading.value || (!allItems.value.length && externalPending.value))
const showExternalNotConfiguredHint = computed(() => externalActive.value && !store.externalLoading && !store.externalConfigured)

const pagesRef = computed(() => store.pagination.pages)
const { loading: infiniteLoading, loadingMore, hasMore, reset, loadMore } = useInfiniteScroll(
  async (page, { append }) => {
    await store.fetchListings({
      page,
      search:     filters.value.search     || undefined,
      category:   filters.value.category   || undefined,
      condition:  filters.value.condition  || undefined,
      sellerType: filters.value.sellerType || undefined,
      location:   filters.value.location   || undefined,
      priceMin:   filters.value.priceMin   || undefined,
      priceMax:   filters.value.priceMax   || undefined
    }, { append })
    // I risultati eBay sono un fallback per lo stesso set di filtri: vanno
    // ricaricati solo al reset (nuova ricerca), non ad ogni pagina in più.
    if (!append && store.pagination.total < 4) {
      store.fetchExternal({ search: filters.value.search || undefined, zip: zip.value || undefined })
    }
  },
  pagesRef
)

const debouncedReset = useDebouncedFn(() => reset(), 320)

watch(filters, debouncedReset, { deep: true })

function resetFilters() {
  filters.value = { search: '', category: '', condition: '', sellerType: '', location: '', priceMin: '', priceMax: '' }
  reset()
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
  reset()
  detectZip()
})
</script>

<style scoped>
.market-toolbar { @apply flex items-center gap-2 mb-4; }

.btn-toggle-active {
  @apply text-ocean bg-ocean/10;
}

.filter-count-badge {
  @apply inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-ocean text-white text-[0.65rem] font-bold px-1;
}

.listings-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.market-empty {
  @apply flex items-center justify-center gap-2 text-muted text-sm py-8;
}

.external-admin-hint { @apply text-muted; }
.external-admin-error { @apply text-danger; }
</style>
