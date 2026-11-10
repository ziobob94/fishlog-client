<template>
  <RouterLink :to="`/market/${listing._id}`"
    class="group block bg-surface border border-border rounded-signature overflow-hidden
           transition-all duration-200 hover:border-ocean hover:-translate-y-0.5
           hover:shadow-[0_4px_24px_rgba(14,165,233,0.1)]"
  >
    <div class="relative aspect-square bg-surface-2 overflow-hidden">
      <img
        v-if="listing.media?.[0]"
        :src="listing.media[0].url"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div v-else class="flex items-center justify-center h-full text-muted">
        <Package :size="40" />
      </div>
      <span class="tag absolute bottom-2 left-2" :class="listing.condition === 'nuovo' ? 'tag-new' : 'tag-used'">
        {{ t(`market.condition.${listing.condition}`) }}
      </span>
      <span v-if="listing.sellerType === 'negozio'" class="tag absolute bottom-2 right-2 icon-inline" :class="isVerifiedShop ? 'tag-shop' : 'tag-used'">
        <Check v-if="isVerifiedShop" :size="12" /><Store v-else :size="12" /> {{ isVerifiedShop ? t('market.sellerType.negozio') : t('market.sellerType.unverified') }}
      </span>
      <span v-if="listing.status !== 'active'" class="badge badge-danger absolute top-2 left-2">
        {{ t(`market.status.${listing.status}`) }}
      </span>
    </div>

    <div class="p-3">
      <p class="font-mono text-ocean-text font-bold text-lg leading-tight">{{ formatPrice(listing.price, listing.currency) }}</p>
      <h3 class="font-bold text-sm mt-1 line-clamp-2 text-foam">{{ listing.title }}</h3>
      <p v-if="listing.location?.name" class="text-muted text-xs mt-1 truncate">{{ listing.location.name }}</p>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Package, Store, Check } from 'lucide-vue-next'

const { t } = useI18n()
const props = defineProps({ listing: { type: Object, required: true } })

const isVerifiedShop = computed(() => props.listing.seller?.shop?.verificationStatus === 'verified')

function formatPrice(price, currency) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: Number.isInteger(price) ? 0 : 2 }).format(price)
}
</script>

<style scoped>
.tag { @apply rounded-md px-2 py-0.5 text-[0.7rem] font-extrabold uppercase; letter-spacing: 0.06em; }
.tag-new { @apply bg-success text-on-primary; }
.tag-used { @apply bg-sand text-on-primary; }
.tag-shop { @apply bg-ocean/20 text-ocean-text normal-case; letter-spacing: 0; }
.icon-inline { display: inline-flex; align-items: center; gap: .25rem; }
</style>
