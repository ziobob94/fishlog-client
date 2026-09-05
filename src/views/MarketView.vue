<template>
  <div class="coming-soon card">
    <ShoppingBag :size="40" class="text-ocean" />
    <h1>{{ t('home.hub.sections.marketplace.title') }}</h1>
    <p class="text-muted">{{ t('home.hub.sections.marketplace.text') }}</p>
    <span class="badge badge-sand">{{ t('home.hub.comingSoon') }}</span>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ShoppingBag } from 'lucide-vue-next'

const { t } = useI18n()
</script>

<style scoped>
.coming-soon { @apply flex flex-col items-center gap-3 text-center py-16 px-6; }
</style>
