<template>
  <a :href="listing.url" target="_blank" rel="noopener noreferrer" :class="`lv-${view}`"
    class="lc group block bg-surface border border-border rounded-lg overflow-hidden
           transition-all duration-200 hover:border-ocean hover:-translate-y-0.5
           hover:shadow-[0_4px_24px_rgba(14,165,233,0.1)]"
  >
    <div class="lc-media relative aspect-[4/3] bg-surface-2 overflow-hidden">
      <img v-if="listing.image" :src="listing.image" loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div v-else class="flex items-center justify-center h-full text-muted"><Package :size="40" /></div>
      <span class="badge source-badge absolute bottom-2 left-2 icon-inline">
        <ExternalLink :size="12" /> {{ sourceLabel }}
      </span>
    </div>
    <div class="lc-body p-3 sm:p-4">
      <p v-if="listing.price != null" class="font-mono text-ocean-text font-bold text-base sm:text-lg leading-tight">{{ formatPrice(listing.price, listing.currency) }}</p>
      <h3 class="font-semibold text-sm mt-0.5 mb-1 line-clamp-2 text-foam">{{ listing.title }}</h3>
      <p v-if="listing.location" class="text-muted text-xs icon-inline min-w-0"><MapPin :size="12" class="shrink-0" /> <span class="truncate">{{ listing.location }}</span></p>
    </div>
  </a>
</template>

<script setup>
import { computed } from 'vue'
import { Package, ExternalLink, MapPin } from 'lucide-vue-next'

// Ogni fonte esterna (searchEbay, e in futuro altre) valorizza già
// listing.source: la card resta la stessa, basta mappare qui il nome da
// mostrare invece di aggiungerne una nuova per ogni nuova piattaforma.
const SOURCE_LABELS = { ebay: 'eBay', subito: 'Subito', vinted: 'Vinted' }

const props = defineProps({ listing: { type: Object, required: true }, view: { type: String, default: 'grid' } })

const sourceLabel = computed(() => SOURCE_LABELS[props.listing.source] || props.listing.source || 'Esterno')

function formatPrice(price, currency) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currency || 'EUR' }).format(price)
}
</script>

<style scoped>
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }
.lc.lv-list { @apply flex flex-row items-stretch; }
.lv-list .lc-media { @apply w-28 shrink-0 aspect-square; }
.lv-list .lc-body { @apply flex-1 min-w-0 flex flex-col justify-center; }
.lv-large .lc-body { @apply p-4; }
.lv-grid3 .lc-body { @apply p-2; }
.lv-grid3 .lc-body p:first-child { @apply text-sm; }
.lv-grid3 h3 { @apply text-xs; }
.lv-grid3 .source-badge, .lv-grid3 .lc-body p:last-child:not(:first-child) { @apply hidden; }

/* Il badge sorgente (link esterno) sta sopra una foto qualunque, spesso
   chiara: il riempimento tenue di .badge-sand ci si perde. Sfondo scuro
   pieno invece del tint trasparente, leggibile su qualsiasi immagine. */
.source-badge {
  background: rgb(0 0 0 / 0.72);
  @apply border border-white/10 text-sand backdrop-blur-sm;
}
</style>
