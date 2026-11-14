<template>
  <!-- Microfono sempre a portata di mano finché c'è un'uscita in corso. -->
  <button v-if="visible" type="button" class="voice-fab" :aria-label="t('voice.fabAria')" :title="t('voice.fabAria')" @click="show">
    <Mic :size="26" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Mic } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import { useSessionStore } from '../stores/sessions.js'
import { useVoiceSheet } from '../composables/useVoiceSheet.js'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const sessions = useSessionStore()
const { show } = useVoiceSheet()

// Non nelle pagine pubbliche né dove la barra in basso è nascosta (scheda dell'uscita, cattura, chiusura,
// chat a tutta altezza...): lì la dettatura è già nella pagina o il pulsante coprirebbe i comandi.
const visible = computed(() => auth.isLoggedIn && !!sessions.ongoing && !route.meta.public && !route.meta.hideBottomNav && !route.meta.fullHeight)
</script>

<style scoped>
.voice-fab {
  position: fixed; right: 16px; z-index: 150;
  bottom: calc(var(--bottom-nav-h) + 16px + env(safe-area-inset-bottom));
  width: 56px; height: 56px; border-radius: 50%; border: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: rgb(var(--color-sand-text)); color: rgb(var(--color-ink));
  box-shadow: 0 8px 22px rgba(0, 0, 0, .35);
}
@media (min-width: 768px) { .voice-fab { bottom: 24px; } }
</style>
