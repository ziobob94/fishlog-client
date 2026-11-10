<template>
  <div v-if="listing" class="listing-view">
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

    <div class="info">
      <p class="price">{{ formatPrice(listing.price, listing.currency) }}</p>
      <h1 class="title">{{ listing.title }}</h1>

      <div class="tags">
        <span class="tag" :class="listing.condition === 'nuovo' ? 'tag-new' : 'tag-used'">{{ t(`market.condition.${listing.condition}`) }}</span>
        <span class="chip">{{ t(`market.categories.${listing.category}`) }}</span>
        <span v-if="listing.location?.name" class="chip icon-inline"><MapPin :size="14" /> {{ listing.location.name }}</span>
        <span v-if="listing.status !== 'active'" class="badge badge-danger">{{ t(`market.status.${listing.status}`) }}</span>
      </div>

      <template v-if="listing.description">
        <h2 class="section-label">{{ t('market.description') }}</h2>
        <p class="description">{{ listing.description }}</p>
      </template>

      <h2 class="section-label">{{ t('market.seller') }}</h2>
      <RouterLink :to="listing.sellerType === 'negozio' && isVerifiedShop ? `/market/shop/${listing.seller._id}` : `/users/${listing.seller._id}`" class="seller-card">
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

      <div class="cta-bar">
        <template v-if="isOwner">
          <RouterLink :to="`/market/${listing._id}/edit`" class="btn btn-secondary">
            <Pencil :size="16" /> {{ t('common.edit') }}
          </RouterLink>
          <select v-model="statusModel" :aria-label="t('market.status.active')" @change="changeStatus">
            <option value="active">{{ t('market.status.active') }}</option>
            <option value="reserved">{{ t('market.status.reserved') }}</option>
            <option value="sold">{{ t('market.status.sold') }}</option>
          </select>
          <button type="button" class="btn btn-danger" :aria-label="t('common.delete')" @click="onDelete">
            <Trash2 :size="16" />
          </button>
        </template>
        <template v-else>
          <RouterLink :to="`/chat/${listing.seller._id}`" class="btn btn-primary cta-main">
            <MessagesSquare :size="16" /> {{ t('market.contactSeller') }}
          </RouterLink>
          <button type="button" class="round-btn round-btn-lg" :aria-label="t('market.share')" @click="share"><Send :size="18" /></button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { toInitials } from '../utils/initials.js'
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Package, MapPin, Check, ChevronRight, ArrowLeft, Send, Pencil, Trash2, MessagesSquare } from 'lucide-vue-next'
import { useMarketStore } from '../stores/market.js'
import { useAuthStore } from '../stores/auth.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useMarketStore()
const auth = useAuthStore()

const listing = computed(() => store.current)
const activeMedia = ref(null)
const statusModel = ref('active')

const isOwner = computed(() => listing.value && (listing.value.seller._id === auth.user?._id || auth.user?.role === 'admin'))
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
  if (!confirm(t('market.deleteConfirm'))) return
  await store.deleteListing(listing.value._id)
  router.push('/market')
}

onMounted(() => store.fetchListing(route.params.id))
</script>

<style scoped>
.listing-view { @apply flex flex-col gap-0 pb-28; }
@media (min-width: 720px) { .listing-view { @apply grid gap-6 pb-4; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); } }

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
    bottom: var(--bottom-nav-h);
  }
}
.cta-main { @apply flex-1 min-h-[48px]; }
</style>
