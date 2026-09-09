<template>
  <RouterLink :to="`/market/shop/${shop._id}`"
    class="group block bg-surface border border-border rounded-lg p-4
           transition-all duration-200 hover:border-ocean hover:-translate-y-0.5
           hover:shadow-[0_4px_24px_rgba(14,165,233,0.1)]"
  >
    <div class="flex items-center gap-3">
      <img v-if="shop.avatar" :src="shop.avatar" class="w-12 h-12 rounded-full object-cover shrink-0" />
      <span v-else class="avatar-placeholder">{{ initials }}</span>
      <div class="min-w-0">
        <h3 class="font-bold text-sm truncate text-foam">{{ shop.shop?.name || shop.displayName }}</h3>
        <p class="text-muted text-xs truncate">{{ shop.displayName }}</p>
      </div>
    </div>
    <p v-if="shop.shop?.description" class="text-muted text-xs mt-2 line-clamp-2">{{ shop.shop.description }}</p>
    <span class="badge badge-sand mt-3 icon-inline"><Tag :size="12" /> {{ t('market.shops.listingsCount', { n: shop.activeListings }) }}</span>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Tag } from 'lucide-vue-next'

const { t } = useI18n()
const props = defineProps({ shop: { type: Object, required: true } })

const initials = computed(() => {
  const name = props.shop.shop?.name || props.shop.displayName || '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})
</script>

<style scoped>
.avatar-placeholder {
  @apply w-12 h-12 shrink-0 rounded-full border border-ocean text-ocean flex items-center
         justify-center text-sm font-bold;
  background: var(--ocean-glow);
}
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }
</style>
