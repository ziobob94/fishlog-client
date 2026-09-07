<template>
  <RouterLink :to="`/market/${listing._id}`"
    class="group block bg-surface border border-border rounded-lg overflow-hidden
           transition-all duration-200 hover:border-ocean hover:-translate-y-0.5
           hover:shadow-[0_4px_24px_rgba(14,165,233,0.1)]"
  >
    <div class="relative aspect-video bg-surface-2 overflow-hidden">
      <img
        v-if="listing.media?.[0]"
        :src="listing.media[0].url"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div v-else class="flex items-center justify-center h-full text-muted">
        <Package :size="40" />
      </div>
      <span class="badge absolute bottom-2 left-2" :class="listing.condition === 'nuovo' ? 'badge-success' : 'badge-sand'">
        {{ t(`market.condition.${listing.condition}`) }}
      </span>
      <span v-if="listing.sellerType === 'negozio'" class="badge badge-ocean absolute bottom-2 right-2 icon-inline">
        <Store :size="12" /> {{ t('market.sellerType.negozio') }}
      </span>
      <span v-if="listing.status !== 'active'" class="badge badge-danger absolute top-2 left-2">
        {{ t(`market.status.${listing.status}`) }}
      </span>
    </div>

    <div class="p-4">
      <h3 class="font-bold text-sm mb-1 truncate text-foam">{{ listing.title }}</h3>
      <p class="font-mono text-ocean font-bold mb-2">{{ formatPrice(listing.price, listing.currency) }}</p>
      <div class="flex flex-wrap gap-1 items-center">
        <span class="chip icon-inline"><Tag :size="14" /> {{ t(`market.categories.${listing.category}`) }}</span>
        <span v-if="listing.location?.name" class="chip chip-muted icon-inline"><MapPin :size="14" /> {{ listing.location.name }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Package, Tag, MapPin, Store } from 'lucide-vue-next'

const { t } = useI18n()
defineProps({ listing: { type: Object, required: true } })

function formatPrice(price, currency) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currency || 'EUR' }).format(price)
}
</script>

<style scoped>
.chip { @apply bg-surface-2 border border-border rounded text-xs px-1.5 py-0.5; }
.chip-muted { @apply text-muted; }
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }
</style>
