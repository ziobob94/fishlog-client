<template>
  <div>
    <div v-if="!online || daCache" class="banner" role="status"><WifiOff :size="16" aria-hidden="true" /> {{ t('gare.pubblica.offline', { quando: salvatoIl }) }}</div>
    <div v-if="caricamento" class="state-center"><div class="m-spinner"></div></div>
    <div v-else-if="nonValido" class="state-center"><h1 class="font-display text-2xl">{{ t('gare.pubblica.nonValido') }}</h1><p class="text-muted mt-1">{{ t('gare.pubblica.nonValidoNota') }}</p></div>
    <template v-else-if="dati">
      <header class="mb-4">
        <p class="text-xs text-muted">{{ dati.prova.organizzazione }}</p>
        <h1 class="font-display text-2xl">{{ dati.prova.manifestazione }} · {{ t('gare.provaN', { n: dati.prova.provaNumero }) }}</h1>
        <p class="text-sm text-muted">{{ dati.prova.campoDiGara }} · <span class="fl-mono">{{ new Date(dati.prova.data).toLocaleDateString('it-IT') }}</span> · {{ dati.prova.societaOrganizzatrice }}</p>
      </header>
      <ClassificheTabelle :data="dati" :titoli="dati.prova.titoli || {}" />
      <footer class="text-xs text-muted mt-4">{{ t('gare.pubblica.piede', { direttore: dati.prova.direttoreDiGara || '—', giudice: dati.prova.giudiceDiGara || '—' }) }}</footer>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { WifiOff } from 'lucide-vue-next'
import ClassificheTabelle from '../../components/fipsas/ClassificheTabelle.vue'
import { fipsasApi } from '../../composables/useFipsas.js'
import { useOnline } from '../../composables/useOnline.js'

const { t } = useI18n()
const route = useRoute()
const online = useOnline()
const dati = ref(null), caricamento = ref(true), nonValido = ref(false), daCache = ref(false), quando = ref(null)
const chiave = `fl_fipsas_${route.params.slug}`
const salvatoIl = computed(() => (quando.value ? new Date(quando.value).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : ''))

// «Offline (dati salvati)»: l'ultima classifica vista resta nel dispositivo (localStorage, solo come comodità).
function leggiCache() { try { return JSON.parse(localStorage.getItem(chiave) || 'null') } catch { return null } }
onMounted(async () => {
  try {
    dati.value = await fipsasApi.pubblica(route.params.slug)
    try { localStorage.setItem(chiave, JSON.stringify({ t: Date.now(), d: dati.value })) } catch { /* cache non disponibile */ }
  } catch (e) {
    if (e.response?.status === 404) nonValido.value = true
    else { const c = leggiCache(); if (c) { dati.value = c.d; quando.value = c.t; daCache.value = true } else nonValido.value = true }
  } finally { caricamento.value = false }
})
</script>

<style scoped>
.banner { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border-radius: 12px; margin-bottom: 12px; font-size: 13px; border: 1px solid rgb(var(--color-sand)); background: rgb(var(--color-sand) / .1); }
</style>
