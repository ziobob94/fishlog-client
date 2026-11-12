<template>
  <div v-if="failed" class="text-center py-16">
    <p class="text-muted">{{ t('market.listingNotFound') }}</p>
    <div class="flex gap-2 justify-center mt-3">
      <button type="button" class="btn" @click="load">{{ t('common.retry') }}</button>
      <button type="button" class="btn btn-primary" @click="router.push('/market')">{{ t('common.back') }}</button>
    </div>
  </div>
  <div v-else-if="!listing" class="text-center py-16" aria-busy="true"><p class="text-muted">…</p></div>
  <div v-else class="listing-view" :class="{ 'has-cta': !isOwner }">
    <div class="gallery">
      <img v-if="activeMedia" :src="activeMedia.url" class="gallery-main" :alt="listing.title" />
      <div v-else class="gallery-placeholder"><Package :size="56" /></div>
      <button type="button" class="round-btn gallery-back" :aria-label="t('common.back')" @click="router.back()"><ArrowLeft :size="18" /></button>
      <div v-if="listing.media?.length > 1" class="gallery-dots" role="tablist">
        <button
          v-for="m in listing.media" :key="m._id" type="button" role="tab" class="gallery-dot"
          :class="{ active: m._id === activeMedia?._id }" :aria-selected="m._id === activeMedia?._id"
          :aria-label="t('market.photo')" @click="activeMedia = m"
        ></button>
      </div>
    </div>

    <div class="photo-actions">
      <template v-if="isOwner">
        <RouterLink :to="`/market/${listing._id}/edit`" class="icon-act" :aria-label="t('common.edit')" :title="t('common.edit')">
          <Pencil :size="17" />
        </RouterLink>
        <label class="status-pick" :title="t('market.status.label')">
          <span class="status-dot" :class="`dot-${statusModel}`" aria-hidden="true"></span>
          <select v-model="statusModel" :aria-label="t('market.status.label')" @change="changeStatus">
            <option value="active">{{ t('market.status.active') }}</option>
            <option value="reserved">{{ t('market.status.reserved') }}</option>
            <option value="sold">{{ t('market.status.sold') }}</option>
          </select>
        </label>
        <button type="button" class="icon-act icon-danger" :aria-label="t('common.delete')" :title="t('common.delete')" @click="onDelete">
          <Trash2 :size="17" />
        </button>
      </template>
      <button type="button" class="icon-act" :aria-label="t('market.share')" :title="t('market.share')" @click="share"><Send :size="17" /></button>
    </div>

    <div class="info">
      <p class="price">{{ formatPrice(listing.price, listing.currency) }}</p>
      <h1 class="title">{{ listing.title }}</h1>

      <div class="tags">
        <span class="tag" :class="listing.condition === 'nuovo' ? 'tag-new' : 'tag-used'">{{ t(`market.condition.${listing.condition}`) }}</span>
        <span class="chip">{{ t(`market.categories.${listing.category}`) }}</span>
        <span v-if="listing.location?.name" class="chip icon-inline"><MapPin :size="14" /> {{ listing.location.name }}</span>
        <span class="chip icon-inline"><Eye :size="14" /> {{ t("market.viewsCount", { n: listing.views || 0 }, listing.views || 0) }}</span>
        <span v-if="listing.status !== 'active'" class="badge badge-danger">{{ t(`market.status.${listing.status}`) }}</span>
      </div>

      <template v-if="listing.description">
        <h2 class="section-label">{{ t('market.description') }}</h2>
        <p class="description">{{ listing.description }}</p>
      </template>

      <h2 class="section-label">{{ t('market.seller') }}</h2>
      <RouterLink v-if="listing.seller" :to="listing.sellerType === 'negozio' && isVerifiedShop ? `/market/shop/${listing.seller?._id}` : `/users/${listing.seller?._id}`" class="seller-card">
        <img v-if="sellerImage" :src="sellerImage" class="seller-avatar" alt="" />
        <span v-else class="seller-avatar seller-initials">{{ initials }}</span>
        <span class="seller-text">
          <span class="seller-name">{{ sellerName }}</span>
          <span class="seller-sub icon-inline">
            <Check v-if="isVerifiedShop" :size="12" />
            {{ isVerifiedShop ? t('market.sellerType.negozio') : listing.sellerType === 'negozio' ? t('market.sellerType.unverified') : t('market.sellerType.privato') }}
          </span>
        </span>
        <ChevronRight :size="18" class="text-muted" />
      </RouterLink>

      <div v-if="!isOwner && listing.seller" class="cta-bar">
        <RouterLink :to="`/chat/${listing.seller?._id}`" class="btn btn-primary cta-main">
          <MessageCircle :size="16" /> {{ t('market.contactSeller') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { confirmDialog } from '../composables/useConfirm.js'
import { toInitials } from '../utils/initials.js'
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Package, Eye, MapPin, Check, ChevronRight, ArrowLeft, Send, Pencil, Trash2, MessageCircle } from 'lucide-vue-next'
import { useMarketStore } from '../stores/market.js'
import { useAuthStore } from '../stores/auth.js'
import api from '../utils/api.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useMarketStore()
const auth = useAuthStore()

const listing = computed(() => store.current)
const activeMedia = ref(null)
const statusModel = ref('active')

const isOwner = computed(() => listing.value && (listing.value.seller?._id === auth.user?._id || auth.user?.role === 'admin'))
const isVerifiedShop = computed(() => listing.value?.seller?.shop?.verificationStatus === 'verified')

watch(listing, (l) => {
  if (l) {
    activeMedia.value = l.media?.[0] || null
    statusModel.value = l.status
  }
})

const sellerName = computed(() => {
  const sl = listing.value?.seller
  return (isVerifiedShop.value && sl?.shop?.name) || sl?.displayName || sl?.email || ''
})
const sellerImage = computed(() => (isVerifiedShop.value && listing.value?.seller?.shop?.logo) || listing.value?.seller?.avatar || '')
const initials = computed(() =>toInitials(sellerName.value))

async function share() {
  const url = window.location.href
  try {
    if (navigator.share) await navigator.share({ title: listing.value.title, url })
    else await navigator.clipboard.writeText(url)
  } catch { /* condivisione annullata */ }
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: Number.isInteger(price) ? 0 : 2 }).format(price)
}

async function changeStatus() {
  await store.updateListing(listing.value._id, { status: statusModel.value })
}

async function onDelete() {
  if (!(await confirmDialog(t('market.deleteConfirm')))) return
  await store.deleteListing(listing.value._id)
  router.push('/market')
}

const failed = ref(false)
async function load() {
  failed.value = false
  store.current = null // niente annuncio precedente mentre carica
  try { await store.fetchListing(route.params.id) } catch { failed.value = true; return }
  // Visualizzazione unica per utente: il server ignora riaperture e il venditore.
  if (!isOwner.value) {
    try { const { data } = await api.post(`/listings/${route.params.id}/view`); if (store.current) store.current.views = data.views } catch { /* accessorio */ }
  }
}
onMounted(load)
</script>

<style scoped>
.listing-view { @apply flex flex-col gap-0; padding-bottom: calc(var(--bottom-nav-h) + 1.5rem + env(safe-area-inset-bottom)); }
.listing-view.has-cta { padding-bottom: calc(var(--bottom-nav-h) + 6rem + env(safe-area-inset-bottom)); }
.photo-actions { @apply flex items-center justify-end gap-1.5 mt-3; }
.photo-actions .status-pick { flex: 0 0 auto; min-width: 0; }
@media (min-width: 720px) { .listing-view { @apply grid gap-x-6 gap-y-0 pb-4; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); } .listing-view .info { grid-column: 2; grid-row: 1 / span 2; } .photo-actions { grid-column: 1; align-self: start; } }

.gallery { @apply relative; }
.gallery-main { @apply w-full aspect-[4/3] object-cover rounded-xl bg-surface-2; }
.gallery-placeholder { @apply w-full aspect-[4/3] flex items-center justify-center text-muted bg-surface-2 rounded-xl; }
.round-btn { @apply flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-surface/90 text-foam cursor-pointer; }
.round-btn-lg { @apply shrink-0 bg-surface-2; }
.gallery-back { @apply absolute top-3 left-3; }
.gallery-dots { @apply absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1; }
.gallery-dot { @apply w-6 h-6 p-0 border-none bg-transparent cursor-pointer relative; }
.gallery-dot::after { content: ''; @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/50; }
.gallery-dot.active::after { @apply w-5 bg-white; }

.info { @apply pt-4; }
.price { @apply font-mono text-3xl font-bold text-ocean-text leading-none; }
.title { @apply text-2xl font-bold text-foam mt-2; }
.tags { @apply flex flex-wrap items-center gap-2 mt-3; }
.tag { @apply rounded-md px-2.5 py-1 text-xs font-extrabold uppercase; letter-spacing: 0.06em; }
.tag-new { @apply bg-success text-on-primary; }
.tag-used { @apply bg-sand text-on-primary; }
.chip { @apply bg-surface-2 border border-border rounded-full text-xs px-3 py-1 text-foam; }
.icon-inline { display: inline-flex; align-items: center; gap: .3rem; }
.section-label { @apply text-xs font-bold uppercase text-muted mt-5 mb-2; letter-spacing: 0.14em; }
.description { @apply text-foam whitespace-pre-line leading-relaxed; }

.seller-card { @apply flex items-center gap-3 p-3 rounded-xl border border-border bg-surface no-underline; }
.seller-avatar { @apply w-12 h-12 rounded-full object-cover shrink-0; }
.seller-initials { @apply flex items-center justify-center border border-ocean text-ocean-text font-bold; background: var(--ocean-glow); }
.seller-text { @apply flex flex-col min-w-0 flex-1; }
.seller-name { @apply font-bold text-foam truncate; }
.seller-sub { @apply text-xs text-muted; }

/* Su mobile la azione principale resta ancorata in basso, sopra la barra. */
.cta-bar {
  @apply flex items-center gap-2 mt-5;
}
@media (max-width: 719px) {
  .cta-bar {
    @apply fixed left-0 right-0 z-20 px-4 py-3 bg-surface border-t border-border mt-0;
    bottom: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom));
  }
}
.cta-main { @apply flex-1 min-h-[48px]; }
.icon-act { @apply flex items-center justify-center shrink-0 w-10 h-10 rounded-xl border border-border-light bg-surface-2 text-foam no-underline cursor-pointer; }
.icon-danger { @apply text-danger-text; border-color: rgb(var(--color-danger) / .6); }
.status-pick { @apply relative flex items-center shrink-0 h-10 rounded-full border border-border-light bg-surface-2; }
.status-pick select { @apply h-full bg-transparent border-0 text-foam font-semibold text-sm pl-7 pr-3; min-height: 40px; appearance: none; -webkit-appearance: none; background-image: none; border-radius: 9999px; }
.status-dot { @apply absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none; }
.dot-active { background: rgb(var(--color-success)); } .dot-reserved { background: rgb(var(--color-sand)); } .dot-sold { background: rgb(var(--color-danger)); }
</style>
