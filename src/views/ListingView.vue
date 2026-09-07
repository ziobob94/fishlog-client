<template>
  <div v-if="listing" class="listing-view">
    <div class="gallery card">
      <img v-if="activeMedia" :src="activeMedia.url" class="gallery-main" />
      <div v-else class="gallery-placeholder"><Package :size="56" /></div>
      <div v-if="listing.media?.length > 1" class="gallery-thumbs">
        <button v-for="m in listing.media" :key="m._id" type="button" class="gallery-thumb" :class="{ active: m._id === activeMedia?._id }" @click="activeMedia = m">
          <img :src="m.url" />
        </button>
      </div>
    </div>

    <div class="info card">
      <div class="flex items-start justify-between gap-2">
        <h1 class="text-xl font-bold text-foam">{{ listing.title }}</h1>
        <span class="badge" :class="listing.condition === 'nuovo' ? 'badge-success' : 'badge-sand'">
          {{ t(`market.condition.${listing.condition}`) }}
        </span>
      </div>
      <p class="font-mono text-2xl text-ocean font-bold mt-2">{{ formatPrice(listing.price, listing.currency) }}</p>

      <div class="flex flex-wrap gap-1.5 mt-2">
        <span class="chip icon-inline"><Tag :size="14" /> {{ t(`market.categories.${listing.category}`) }}</span>
        <span v-if="listing.location?.name" class="chip chip-muted icon-inline"><MapPin :size="14" /> {{ listing.location.name }}</span>
        <span v-if="listing.status !== 'active'" class="badge badge-danger">{{ t(`market.status.${listing.status}`) }}</span>
      </div>

      <p v-if="listing.description" class="text-muted mt-3 whitespace-pre-line">{{ listing.description }}</p>

      <div class="seller-row mt-4">
        <span v-if="listing.sellerType === 'negozio'" class="badge icon-inline" :class="isVerifiedShop ? 'badge-ocean' : 'badge-sand'">
          <Store :size="12" /> {{ isVerifiedShop ? t('market.sellerType.negozio') : t('market.sellerType.unverified') }}
        </span>
        <RouterLink :to="`/users/${listing.seller._id}`" class="text-ocean hover:underline">
          {{ listing.seller.displayName || listing.seller.email }}
        </RouterLink>
      </div>

      <div class="mt-4 flex gap-2 flex-wrap">
        <template v-if="isOwner">
          <RouterLink :to="`/market/${listing._id}/edit`" class="btn btn-secondary btn-sm">
            <Pencil :size="14" /> {{ t('common.edit') }}
          </RouterLink>
          <select v-model="statusModel" class="btn-sm" @change="changeStatus" style="min-width:130px">
            <option value="active">{{ t('market.status.active') }}</option>
            <option value="reserved">{{ t('market.status.reserved') }}</option>
            <option value="sold">{{ t('market.status.sold') }}</option>
          </select>
          <button type="button" class="btn btn-danger btn-sm" @click="onDelete">
            <Trash2 :size="14" /> {{ t('common.delete') }}
          </button>
        </template>
        <RouterLink v-else :to="`/chat/${listing.seller._id}`" class="btn btn-primary btn-sm">
          <MessagesSquare :size="14" /> {{ t('market.contactSeller') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Package, Tag, MapPin, Store, Pencil, Trash2, MessagesSquare } from 'lucide-vue-next'
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

function formatPrice(price, currency) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currency || 'EUR' }).format(price)
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
.listing-view { @apply grid gap-4; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
@media (max-width: 720px) { .listing-view { grid-template-columns: 1fr; } }

.gallery-main { @apply w-full aspect-video object-cover rounded-lg; }
.gallery-placeholder { @apply w-full aspect-video flex items-center justify-center text-muted bg-surface-2 rounded-lg; }
.gallery-thumbs { @apply flex gap-2 mt-2 flex-wrap; }
.gallery-thumb { @apply w-16 h-16 rounded overflow-hidden border border-border p-0; }
.gallery-thumb.active { @apply border-ocean; }
.gallery-thumb img { @apply w-full h-full object-cover; }

.chip { @apply bg-surface-2 border border-border rounded text-xs px-1.5 py-0.5; }
.chip-muted { @apply text-muted; }
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }
.seller-row { @apply flex items-center gap-2; }
</style>
