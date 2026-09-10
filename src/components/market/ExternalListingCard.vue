<template>
  <a :href="listing.url" target="_blank" rel="noopener noreferrer"
    class="group block bg-surface border border-border rounded-lg overflow-hidden
           transition-all duration-200 hover:border-ocean hover:-translate-y-0.5
           hover:shadow-[0_4px_24px_rgba(14,165,233,0.1)]"
  >
    <div class="relative aspect-video bg-surface-2 overflow-hidden">
      <img v-if="listing.image" :src="listing.image" loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div v-else class="flex items-center justify-center h-full text-muted"><Package :size="40" /></div>
      <span class="badge source-badge absolute bottom-2 left-2 icon-inline">
        <ExternalLink :size="12" /> {{ sourceLabel }}
      </span>
    </div>
    <div class="p-4">
      <h3 class="font-bold text-sm mb-1 truncate text-foam">{{ listing.title }}</h3>
      <p v-if="listing.price != null" class="font-mono text-ocean font-bold mb-2">{{ formatPrice(listing.price, listing.currency) }}</p>
      <p v-if="listing.location" class="text-muted text-xs icon-inline"><MapPin :size="14" /> {{ listing.location }}</p>
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

const props = defineProps({ listing: { type: Object, required: true } })

const sourceLabel = computed(() => SOURCE_LABELS[props.listing.source] || props.listing.source || 'Esterno')

function formatPrice(price, currency) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currency || 'EUR' }).format(price)
}
</script>

<style scoped>
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }

/* Il badge sorgente (link esterno) sta sopra una foto qualunque, spesso
   chiara: il riempimento tenue di .badge-sand ci si perde. Sfondo scuro
   pieno invece del tint trasparente, leggibile su qualsiasi immagine. */
.source-badge {
  background: rgb(0 0 0 / 0.72);
  @apply border border-white/10 text-sand backdrop-blur-sm;
}
</style>
