<template>
  <div>
    <PageHeader :title="t('market.title')">
      <RouterLink to="/market/new" class="btn btn-primary btn-sm"><Plus :size="16" /> {{ t('market.sell') }}</RouterLink>
    </PageHeader>

    <div class="segmented" role="tablist">
      <button
        type="button" role="tab" :aria-selected="tab === 'listings'"
        class="seg-opt" :class="{ active: tab === 'listings' }" @click="tab = 'listings'"
      >{{ t('market.tabs.listings') }}</button>
      <button
        type="button" role="tab" :aria-selected="tab === 'shops'"
        class="seg-opt" :class="{ active: tab === 'shops' }" @click="tab = 'shops'"
      >{{ t('market.tabs.shops') }}</button>
      <button
        type="button" role="tab" :aria-selected="tab === 'ebay'"
        class="seg-opt" :class="{ active: tab === 'ebay' }" @click="tab = 'ebay'"
      >{{ t('market.tabs.ebay') }}</button>
    </div>

    <template v-if="tab !== 'shops'">
      <div class="search-row">
        <div class="search-wrap">
          <Search :size="16" class="search-icon" />
          <input
            :value="curFilters.search" type="search" class="search-input"
            :placeholder="t('market.filters.searchPlaceholder')" :aria-label="t('market.filters.searchPlaceholder')"
            @input="setFilter('search', $event.target.value)"
          />
        </div>
        <button
          type="button" class="filter-btn" :class="{ active: showFilters || activeFilterCount }"
          :aria-pressed="showFilters" :aria-label="t('market.filters.title')" @click="showFilters = !showFilters"
        >
          <SlidersHorizontal :size="18" />
          <span v-if="activeFilterCount" class="filter-count-badge">{{ activeFilterCount }}</span>
        </button>
        <div class="view-wrap">
          <button type="button" class="filter-btn" :aria-label="t('market.view.label')" :aria-expanded="viewMenu" @click.stop="viewMenu = !viewMenu">
            <component :is="VIEW_ICONS[view]" :size="18" />
          </button>
          <div v-if="viewMenu" class="view-menu" role="menu">
            <button v-for="v in LIST_VIEWS" :key="v" type="button" role="menuitemradio" :aria-checked="view === v" :class="{ on: view === v }" @click="view = v; viewMenu = false">
              <component :is="VIEW_ICONS[v]" :size="18" /> {{ t(`market.view.${v}`) }}
            </button>
          </div>
        </div>
      </div>

      <div class="chips" role="group" :aria-label="t('market.filters.allCategories')">
        <button type="button" class="chip" :class="{ 'chip-on': !curFilters.category }" :aria-pressed="!curFilters.category" @click="setFilter('category', '')">{{ t('market.filters.all') }}</button>
        <button
          v-for="c in store.categories" :key="c" type="button" class="chip"
          :class="{ 'chip-on': curFilters.category === c }" :aria-pressed="curFilters.category === c"
          @click="setFilter('category', c)"
        >{{ t(`market.categories.${c}`) }}</button>
      </div>

      <div v-if="activeFilterCount" class="active-filters">
        <span class="text-muted text-xs">{{ t('market.filters.active') }}</span>
        <button v-for="f in activeChips" :key="f.key" type="button" class="chip chip-on chip-remove" @click="setFilter(f.key, '')">
          {{ f.label }} <X :size="14" />
        </button>
      </div>
    </template>

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

      <div v-else class="listings-grid" :class="`gv-${view}`">
        <ListingCard v-for="l in store.listings" :key="l._id" :listing="l" :view="view" />
      </div>

      <InfiniteSentinel :active="listingsHasMore" :loading="listingsLoadingMore" @trigger="listingsLoadMore" />
    </template>

    <!-- Tab Negozi: elenco delle vetrine verificate, separato dagli annunci
         perché qui si sfoglia per venditore invece che per articolo. -->
    <template v-else-if="tab === 'shops'">
      <div class="search-wrap mb-4">
        <Search :size="16" class="search-icon" />
        <input
          v-model="shopSearch" type="search" :placeholder="t('market.shops.searchPlaceholder')"
          :aria-label="t('market.shops.searchPlaceholder')" class="search-input"
        />
      </div>

      <div v-if="shopsInfiniteLoading" class="state-center">
        <div class="spinner"></div>
      </div>

      <div v-else-if="!store.shops.length" class="market-empty">
        <Store :size="20" />
        <p>{{ t('market.shops.empty') }}</p>
      </div>

      <div v-else class="shops-grid" :class="{ 'gv-list': view === 'list' || view === 'large' }">
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

      <div v-else class="listings-grid" :class="`gv-${view}`">
        <ExternalListingCard v-for="(l, i) in store.external" :key="`e-${i}`" :listing="l" :view="view" />
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
import PageHeader from '../components/PageHeader.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { Package, Store, Globe, Plus, Search, SlidersHorizontal, X, LayoutGrid, List, RectangleHorizontal, Grid3x3 } from 'lucide-vue-next'
import { useListView, LIST_VIEWS } from '../composables/useListView.js'
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
const { view } = useListView()
const viewMenu = ref(false)
const VIEW_ICONS = { grid: LayoutGrid, list: List, large: RectangleHorizontal, grid3: Grid3x3 }
if (typeof document !== 'undefined') document.addEventListener('click', () => { viewMenu.value = false })
const store = useMarketStore()
const auth  = useAuthStore()

const tab = ref('listings')
const showFilters = ref(false)
const zip = ref('')

const curFilters = computed(() => tab.value === 'ebay' ? ebayFilters.value : filters.value)
// Il contatore e i chip "Filtro attivo" non contano la ricerca testuale e la
// categoria: quelle hanno già il loro campo e i chip sopra.
const activeFilterCount = computed(() => activeChips.value.length)
const activeChips = computed(() => {
  const f = curFilters.value
  const out = []
  if (f.condition) out.push({ key: 'condition', label: t(`market.condition.${f.condition}`) })
  if (f.location) out.push({ key: 'location', label: f.location })
  if (f.priceMin) out.push({ key: 'priceMin', label: `≥ ${f.priceMin} €` })
  if (f.priceMax) out.push({ key: 'priceMax', label: `≤ ${f.priceMax} €` })
  return out
})
function setFilter(key, value) {
  const target = tab.value === 'ebay' ? ebayFilters : filters
  target.value = { ...target.value, [key]: value }
}

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
// la tab di apertura è eBay (vedi onMounted), le altre due solo se aperte.
watch(tab, (value) => {
  if (value === 'shops' && !store.shops.length) shopsReset()
  if (value === 'listings' && !store.listings.length) listingsReset()
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
  ebayReset()
  detectZip()
})
</script>

<style scoped>
.market-head { @apply flex items-center justify-between gap-2 mb-4; }
.market-title { @apply text-3xl font-bold text-foam; }

.segmented { @apply flex gap-0.5 p-0.5 mb-2 bg-surface-2 border border-border rounded-full; }
.seg-opt { @apply flex-1 min-h-[36px] rounded-full bg-transparent border-none text-[0.8125rem] font-semibold text-foam cursor-pointer whitespace-nowrap; }
.seg-opt.active { @apply bg-ocean text-on-primary; }

.search-row { @apply flex items-center gap-1.5 mb-2; }
.search-wrap { @apply relative flex-1; }
.search-icon { @apply absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none; }
.search-input { @apply w-full min-h-[40px] h-10 rounded-xl pl-9 pr-3 text-sm; }
.filter-btn {
  @apply relative flex items-center justify-center w-10 h-10 shrink-0 rounded-xl border border-border bg-surface text-foam cursor-pointer;
}
.filter-btn.active { @apply border-ocean text-ocean-text; background: var(--ocean-glow); }
.filter-count-badge {
  @apply absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-sand text-on-primary text-[0.65rem] font-bold px-1;
}

.chips { @apply flex gap-1.5 overflow-x-auto pb-1 mb-2; scrollbar-width: none; }
.chips::-webkit-scrollbar { display: none; }
.chip {
  @apply inline-flex items-center gap-1.5 shrink-0 min-h-[32px] px-3 rounded-full border border-border bg-surface text-foam text-[0.8125rem] font-semibold cursor-pointer whitespace-nowrap;
}
.chip-on { @apply bg-ocean border-ocean text-on-primary; }
.active-filters { @apply flex flex-wrap items-center gap-2 mb-3; }
.chip-remove { @apply min-h-[36px] px-3; background: var(--ocean-glow); @apply text-ocean-text border-ocean; }

.listings-grid {
  @apply grid gap-3;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.shops-grid { @apply grid gap-3; grid-template-columns: minmax(0, 1fr); }
.view-wrap { @apply relative shrink-0; }
.view-menu { @apply absolute right-0 top-11 z-30 min-w-[190px] flex flex-col bg-surface-2 border border-border rounded-xl p-1.5 shadow-lg; }
.view-menu button { @apply flex items-center gap-2.5 text-left text-sm font-semibold px-3 min-h-[44px] rounded-lg bg-transparent border-none text-foam cursor-pointer hover:bg-surface; }
.view-menu button.on { @apply text-ocean-text; }
.listings-grid.gv-list, .listings-grid.gv-large { grid-template-columns: minmax(0, 1fr); }
.listings-grid.gv-grid3 { @apply gap-2; grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (min-width: 640px) {
  .listings-grid.gv-grid { @apply gap-4; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
  .listings-grid.gv-large { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
  .listings-grid.gv-grid3 { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .shops-grid { @apply gap-4; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
}

.market-empty {
  @apply flex items-center justify-center gap-2 text-muted text-sm py-8;
}

.external-admin-hint { @apply text-muted; }
.external-admin-error { @apply text-danger; }
</style>
