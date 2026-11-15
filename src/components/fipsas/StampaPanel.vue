<template>
  <section class="grid gap-4 lg:grid-cols-2">
    <div class="card">
      <h2 class="font-display text-lg mb-1">{{ t('gare.stampa.cosa') }}</h2>
      <p class="text-xs text-muted mb-3">{{ t('gare.stampa.nota') }}</p>
      <fieldset class="grid gap-1">
        <legend class="sr-only">{{ t('gare.stampa.cosa') }}</legend>
        <label v-for="d in docsDisponibili" :key="d.id" class="chk"><input v-model="docs" type="checkbox" :value="d.id" /><span>{{ d.label }}<small class="text-muted"> · {{ d.layout }}</small></span></label>
      </fieldset>
      <div class="grid gap-3 sm:grid-cols-2 mt-3">
        <label class="f">{{ t('gare.prova.direttore') }}<input v-model="direttore" maxlength="160" /></label>
        <label class="f">{{ t('gare.prova.giudice') }}<input v-model="giudice" maxlength="160" /></label>
      </div>
      <p class="text-xs text-muted mt-2">{{ t('gare.stampa.orario', { ora }) }}</p>
      <p class="avviso mt-3" role="note">{{ t('gare.stampa.senzaLogo') }}</p>
      <p v-if="errore" class="error-msg mt-2" role="alert">{{ errore }}</p>
      <div class="grid gap-2 sm:grid-cols-2 mt-3">
        <button class="btn btn-secondary w-full" :disabled="!docs.length || lavoro" @click="anteprima">{{ t('gare.stampa.anteprima') }}</button>
        <button class="btn btn-primary w-full" :disabled="!docs.length || lavoro" @click="scarica">{{ t('gare.stampa.scarica') }}</button>
      </div>
      <figure v-if="anteprimaUrl" class="a4-wrap mt-3">
        <iframe :src="anteprimaUrl" class="a4" :title="t('gare.stampa.anteprimaTitolo')"></iframe>
        <figcaption class="text-xs text-muted mt-1">{{ t('gare.stampa.anteprimaNota') }} <a :href="anteprimaUrl" target="_blank" rel="noopener" class="underline">{{ t('gare.stampa.anteprimaApri') }}</a></figcaption>
      </figure>
    </div>

    <div class="card">
      <h2 class="font-display text-lg mb-1">{{ t('gare.pubblica.titolo') }}</h2>
      <p class="text-sm text-muted mb-3">{{ t('gare.pubblica.nota') }}</p>
      <label v-if="org" class="chk"><input type="checkbox" :checked="prova.isPublic" @change="imposta($event.target.checked)" /><span>{{ t('gare.pubblica.attiva') }}</span></label>
      <template v-if="prova.isPublic && prova.slug">
        <div class="flex gap-2 mt-3"><input readonly :value="link" class="flex-1 fl-mono" :aria-label="t('gare.pubblica.link')" @focus="$event.target.select()" />
          <button class="btn btn-secondary" @click="copia">{{ copiato ? t('gare.pubblica.copiato') : t('gare.pubblica.copia') }}</button></div>
        <div class="qr-box mt-3">
          <div class="qr" role="img" :aria-label="t('gare.pubblica.qrAlt')" v-html="qr"></div>
          <p class="text-xs text-muted">{{ t('gare.pubblica.qrNota') }}</p>
        </div>
        <p class="text-xs text-muted mt-2">{{ t('gare.pubblica.privacy') }}</p>
      </template>
      <p v-else-if="!org" class="text-sm text-muted">{{ t('gare.pubblica.nonAttiva') }}</p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { fipsasApi } from '../../composables/useFipsas.js'
import { qrSvg } from '../../utils/qr.js'
import { useToast } from '../../composables/useToast.js'

const props = defineProps({ prova: { type: Object, required: true } })
const emit = defineEmits(['aggiornata'])
const { t } = useI18n()
const { toast } = useToast()
const org = computed(() => props.prova.ruolo === 'organizer')
const o = { portrait: 'A4 verticale', landscape: 'A4 orizzontale' }
const docsDisponibili = computed(() => [
  { id: 'settori-pieni', label: t('gare.classifiche.tabPieni'), layout: o.landscape }, { id: 'settore', label: t('gare.stampa.settori'), layout: o.landscape },
  { id: 'giornata', label: t('gare.classifiche.giornata'), layout: o.portrait }, { id: 'progressiva', label: t('gare.classifiche.progressiva'), layout: o.landscape },
  { id: 'squadre', label: t('gare.classifiche.squadre'), layout: o.portrait },
])
const docs = ref(['settori-pieni', 'settore', 'giornata', 'progressiva', 'squadre'])
const direttore = ref(props.prova.direttoreDiGara || ''), giudice = ref(props.prova.giudiceDiGara || '')
const ora = new Date().toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
const lavoro = ref(false), errore = ref(''), copiato = ref(false)

const anteprimaUrl = ref('')
const pdfBlob = () => fipsasApi.pdf(props.prova._id, docs.value, direttore.value, giudice.value)
async function scarica() {
  lavoro.value = true; errore.value = ''
  try {
    const blob = await pdfBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `classifiche-prova-${props.prova.provaNumero}.pdf`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  } catch { errore.value = t('gare.stampa.errore') } finally { lavoro.value = false }
}
// Anteprima: lo stesso PDF che si scarica, mostrato in una pagina A4 (verticale) prima della stampa.
async function anteprima() {
  lavoro.value = true; errore.value = ''
  try {
    const blob = await pdfBlob()
    if (anteprimaUrl.value) URL.revokeObjectURL(anteprimaUrl.value)
    anteprimaUrl.value = URL.createObjectURL(blob)
  } catch { errore.value = t('gare.stampa.errore') } finally { lavoro.value = false }
}
onBeforeUnmount(() => { if (anteprimaUrl.value) URL.revokeObjectURL(anteprimaUrl.value) })
const link = computed(() => `${location.origin}/gare/p/${props.prova.slug}`)
const qr = computed(() => { try { return qrSvg(link.value) } catch { return '' } })
async function imposta(v) { try { emit('aggiornata', await fipsasApi.patch(props.prova._id, { isPublic: v })) } catch (e) { toast(e.response?.data?.error || t('common.error'), { type: 'danger' }) } }
async function copia() { try { await navigator.clipboard.writeText(link.value); copiato.value = true; setTimeout(() => (copiato.value = false), 2000) } catch { /* link già selezionabile */ } }
</script>

<style scoped>
.f { display: grid; gap: 4px; font-size: 12px; color: rgb(var(--color-muted)); } .f input { min-height: 44px; }
.chk { display: flex; gap: 10px; align-items: center; min-height: 44px; } .chk input { width: 22px; height: 22px; }
.qr-box { display: flex; gap: 14px; align-items: center; } .qr { width: 132px; height: 132px; flex: none; border-radius: 12px; overflow: hidden; background: #fff; } .qr :deep(svg) { width: 100%; height: 100%; display: block; }
.a4-wrap { margin: 0; } .a4 { width: 100%; aspect-ratio: 210 / 297; border: 1px solid rgb(var(--color-border)); border-radius: 8px; background: #fff; }
.avviso { border: 1px solid rgb(var(--color-sand)); background: rgb(var(--color-sand) / .1); border-radius: 12px; padding: 10px 12px; font-size: 13px; }
</style>
