<template>
  <!-- Fishy, l'assistente vocale: sempre a portata di mano, anche senza uscita in corso. -->
  <button v-if="visible" type="button" class="fishy-fab" :aria-label="t('fishy.fabAria')" :title="t('fishy.fabAria')" @click="show">
    <Mic :size="26" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Mic } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import { useFishySheet } from '../composables/useFishySheet.js'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const { show } = useFishySheet()

// Sempre visibile nelle pagine con la barra in basso. Non nelle pagine pubbliche né dove la barra è nascosta
// (scheda dell'uscita, cattura, chiusura, chat a tutta altezza...): lì Fishy è già nella pagina o il pulsante coprirebbe i comandi.
const visible = computed(() => auth.isLoggedIn && !route.meta.public && !route.meta.hideBottomNav && !route.meta.fullHeight)
</script>

<style scoped>
.fishy-fab {
  position: fixed; right: 16px; z-index: 150;
  bottom: calc(var(--bottom-nav-h) + 16px + env(safe-area-inset-bottom));
  width: 56px; height: 56px; border-radius: 50%; border: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: rgb(var(--color-sand-text)); color: rgb(var(--color-ink));
  box-shadow: 0 8px 22px rgba(0, 0, 0, .35);
}
@media (min-width: 768px) { .fishy-fab { bottom: 24px; } }
</style>
