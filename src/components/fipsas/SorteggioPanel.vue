<template>
  <section>
    <div v-if="fatto" class="avviso ok mb-3" role="status">
      <span>{{ t('gare.sorteggio.confermato', { quando }) }}</span>
      <button v-if="org" type="button" class="btn btn-ghost btn-sm" @click="rifai">{{ t('gare.sorteggio.rifai') }}</button>
    </div>
    <div v-else class="card mb-3">
      <p class="text-sm text-muted mb-3">{{ t('gare.sorteggio.nota', { n: prova.regole.concorrentiPerSettore }) }}</p>
      <button v-if="org" class="btn btn-primary" :disabled="lavoro" @click="esegui(false)">{{ t('gare.sorteggio.esegui') }}</button>
      <p v-else class="text-sm text-muted">{{ t('gare.sorteggio.soloOrg') }}</p>
    </div>
    <p v-if="esito?.conflittiSquadra" class="avviso mb-3" role="alert">{{ t('gare.sorteggio.conflitti', { n: esito.conflittiSquadra }) }}</p>
    <p v-if="esito?.settoreTecnico" class="avviso mb-3" role="alert">{{ t('gare.sorteggio.tecnico', { l: esito.settoreTecnico.lettera, n: esito.settoreTecnico.concorrenti }) }}</p>
    <p v-if="errore" class="error-msg mb-2" role="alert">{{ errore }}</p>

    <div v-if="fatto" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="s in settori" :key="s.lettera" class="card">
        <h3 class="font-display text-base mb-1">{{ t('gare.settoreN', { l: s.lettera }) }} <span class="fl-mono text-xs" :class="s.righe.length >= cap ? 'text-success-text' : 'text-sand-text'">{{ s.righe.length }}/{{ cap }}</span></h3>
        <ol class="text-sm">
          <li v-for="c in s.righe" :key="c._id" class="flex gap-2"><span class="fl-mono text-muted w-7 text-right">{{ c.numeroGara }}</span>{{ c.cognome }} {{ c.nome }}</li>
        </ol>
        <p v-if="s.righe.length < cap" class="text-xs text-sand-text mt-1">{{ t('gare.sorteggio.nonPieno') }}</p>
      </div>
    </div>
    <p class="legenda mt-3">{{ t('gare.sorteggio.legenda') }}</p>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fipsasApi } from '../../composables/useFipsas.js'
import { confirmDialog } from '../../composables/useConfirm.js'

const props = defineProps({ prova: { type: Object, required: true } })
const emit = defineEmits(['cambiato'])
const { t } = useI18n()
const org = computed(() => props.prova.ruolo === 'organizer')
const fatto = computed(() => !!props.prova.sorteggio?.confirmedAt)
const cap = computed(() => props.prova.regole.concorrentiPerSettore)
const quando = computed(() => (fatto.value ? new Date(props.prova.sorteggio.confirmedAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : ''))
const lavoro = ref(false), errore = ref(''), esito = ref(null), elenco = ref([])
const settori = computed(() => {
  const m = new Map()
  for (const c of elenco.value) if (c.settore) { if (!m.has(c.settore)) m.set(c.settore, []); m.get(c.settore).push(c) }
  return [...m.entries()].sort().map(([lettera, righe]) => ({ lettera, righe: righe.sort((a, b) => a.numeroGara - b.numeroGara) }))
})
async function carica() { elenco.value = (await fipsasApi.concorrenti(props.prova._id)).concorrenti }
onMounted(carica)

async function esegui(conferma) {
  lavoro.value = true; errore.value = ''
  try { esito.value = await fipsasApi.sorteggio(props.prova._id, conferma); emit('cambiato'); await carica() }
  catch (e) { errore.value = e.response?.data?.error || t('common.error') } finally { lavoro.value = false }
}
async function rifai() {
  if (await confirmDialog(t('gare.sorteggio.rifaiAvviso'), { title: t('gare.sorteggio.rifai'), confirmLabel: t('gare.sorteggio.rifai') })) esegui(true)
}
</script>

<style scoped>
.avviso { display: flex; gap: 12px; align-items: center; justify-content: space-between; border: 1px solid rgb(var(--color-sand)); background: rgb(var(--color-sand) / .1); border-radius: 12px; padding: 10px 12px; font-size: 13px; }
.avviso.ok { border-color: rgb(var(--color-success)); background: rgb(var(--color-success) / .1); }
.legenda { font-size: 12px; color: rgb(var(--color-muted)); }
</style>
