<template>
  <div>
    <div v-if="!store.mine.length" class="state-center">
      <p class="text-muted">{{ t('market.mine.empty') }}</p>
    </div>

    <div v-else class="listings-grid">
      <ListingCard v-for="l in store.mine" :key="l._id" :listing="l" />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMarketStore } from '../stores/market.js'
import ListingCard from '../components/market/ListingCard.vue'

const { t } = useI18n()
const store = useMarketStore()

onMounted(() => store.fetchMine())
</script>

<style scoped>
.listings-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
</style>
