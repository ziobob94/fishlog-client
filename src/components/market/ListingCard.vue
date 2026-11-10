<template>
  <RouterLink :to="`/market/${listing._id}`" :class="`lv-${view}`"
    class="lc group block bg-surface border border-border rounded-signature overflow-hidden
           transition-all duration-200 hover:border-ocean hover:-translate-y-0.5
           hover:shadow-[0_4px_24px_rgba(14,165,233,0.1)]"
  >
    <div class="lc-media relative aspect-square bg-surface-2 overflow-hidden">
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
      <span v-if="listing.sellerType === 'negozio'" class="tag tag-seller absolute bottom-2 right-2 icon-inline" :class="isVerifiedShop ? 'tag-shop' : 'tag-used'">
        <Check v-if="isVerifiedShop" :size="12" /><Store v-else :size="12" /> {{ isVerifiedShop ? t('market.sellerType.negozio') : t('market.sellerType.unverified') }}
      </span>
      <span v-if="listing.status !== 'active'" class="badge badge-danger absolute top-2 left-2">
        {{ t(`market.status.${listing.status}`) }}
      </span>
    </div>

    <div class="lc-body p-3">
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
const props = defineProps({ listing: { type: Object, required: true }, view: { type: String, default: 'grid' } })

const isVerifiedShop = computed(() => props.listing.seller?.shop?.verificationStatus === 'verified')

function formatPrice(price, currency) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: Number.isInteger(price) ? 0 : 2 }).format(price)
}
</script>

<style scoped>
.lc.lv-list { @apply flex flex-row items-stretch rounded-xl; }
.lv-list .lc-media { @apply w-28 shrink-0 aspect-square; }
.lv-list .tag-seller { @apply hidden; }
.lv-list .lc-body { @apply flex-1 min-w-0 flex flex-col justify-center; }
.lv-large .lc-media { @apply aspect-[4/3]; }
.lv-large .lc-body { @apply p-4; }
.lv-large h3 { @apply text-base; }
.lv-grid3 { @apply rounded-xl; }
.lv-grid3 .lc-body { @apply p-2; }
.lv-grid3 .lc-body p:first-child { @apply text-sm; }
.lv-grid3 h3 { @apply text-xs mt-0.5; }
.lv-grid3 .lc-body p:last-child:not(:first-child), .lv-grid3 .tag { @apply hidden; }
.tag { @apply rounded-md px-2 py-0.5 text-[0.7rem] font-extrabold uppercase; letter-spacing: 0.06em; }
.tag-new { @apply bg-success text-on-primary; }
.tag-used { @apply bg-sand text-on-primary; }
.tag-shop { @apply bg-ocean/20 text-ocean-text normal-case; letter-spacing: 0; }
.icon-inline { display: inline-flex; align-items: center; gap: .25rem; }
</style>
