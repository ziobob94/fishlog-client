<template>
  <section>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      <div v-for="k in contatori" :key="k.l" class="card stat"><div class="fl-mono stat-n">{{ k.n }}</div><div class="text-xs text-muted">{{ k.l }}</div></div>
    </div>

    <div v-for="s in info.squadreIncomplete" :key="s.societa + s.squadra" class="avviso mb-2" role="alert">
      {{ t('gare.iscritti.incompleta', { sq: s.squadra, societa: s.societa, n: s.componenti, tot: s.richiesti }) }}
    </div>

    <div class="flex flex-wrap gap-2 mb-3">
      <input v-model="filtro" type="search" class="flex-1 min-w-[160px]" :placeholder="t('gare.iscritti.cerca')" :aria-label="t('gare.iscritti.cerca')" />
      <template v-if="org">
        <button class="btn btn-secondary" type="button" @click="mostraCsv = !mostraCsv">{{ t('gare.iscritti.importa') }}</button>
        <button class="btn btn-primary" type="button" :disabled="bloccato" @click="mostraNuovo = !mostraNuovo">{{ t('gare.iscritti.aggiungi') }}</button>
      </template>
    </div>
    <p v-if="bloccato && org" class="text-xs text-muted mb-2">{{ t('gare.iscritti.bloccato') }}</p>

    <form v-if="mostraNuovo" class="card mb-3 grid gap-2 sm:grid-cols-5" @submit.prevent="aggiungi">
      <input v-model="n.cognome" :placeholder="t('gare.col.cognome')" :aria-label="t('gare.col.cognome')" required />
      <input v-model="n.nome" :placeholder="t('gare.col.nome')" :aria-label="t('gare.col.nome')" />
      <input v-model="n.societa" :placeholder="t('gare.col.societa')" :aria-label="t('gare.col.societa')" />
      <select v-model="n.squadra" :aria-label="t('gare.col.sq')"><option v-for="s in ['A','B','C','*']" :key="s" :value="s">{{ s }}</option></select>
      <button class="btn btn-primary">{{ t('common.add') }}</button>
    </form>

    <div v-if="mostraCsv" class="card mb-3">
      <p class="text-sm text-muted mb-2">{{ t('gare.iscritti.csvNota') }}</p>
      <input type="file" accept=".csv,text/csv,text/plain" :aria-label="t('gare.iscritti.file')" @change="leggiFile" />
      <textarea v-model="csv" rows="4" class="fl-mono mt-2 w-full" :aria-label="t('gare.iscritti.csvTesto')" @input="anteprima"></textarea>
      <div v-if="prev" class="mt-2 text-sm">
        <p><strong class="fl-mono">{{ prev.validi }}</strong> {{ t('gare.iscritti.righeValide') }} · <strong class="fl-mono">{{ prev.errori.length }}</strong> {{ t('gare.iscritti.righeErrore') }}</p>
        <ul v-if="prev.errori.length" class="text-danger-text mt-1"><li v-for="e in prev.errori.slice(0, 10)" :key="e.riga">{{ t('gare.iscritti.riga', { n: e.riga }) }}: {{ e.errore }}</li></ul>
        <button class="btn btn-primary mt-2" :disabled="!prev.validi || bloccato" @click="conferma">{{ t('gare.iscritti.importaN', { n: prev.validi }) }}</button>
      </div>
    </div>

    <p v-if="!lista.length" class="state-empty">{{ t('gare.iscritti.vuoto') }}</p>
    <div v-else class="tbl-wrap">
      <table class="tbl">
        <caption class="sr-only">{{ t('gare.tab.iscritti') }}</caption>
        <thead><tr><th scope="col" class="num">{{ t('gare.col.gara') }}</th><th scope="col">{{ t('gare.col.concorrente') }}</th><th scope="col">{{ t('gare.col.societa') }}</th><th scope="col">{{ t('gare.col.sq') }}</th><th scope="col">{{ t('gare.settore') }}</th><th v-if="org" scope="col">{{ t('gare.col.stato') }}</th><th v-if="org && !bloccato" scope="col"><span class="sr-only">{{ t('common.delete') }}</span></th></tr></thead>
        <tbody>
          <tr v-for="c in lista" :key="c._id">
            <td class="num fl-mono">{{ c.numeroGara ?? '–' }}</td>
            <td>{{ c.cognome }} {{ c.nome }}</td><td>{{ c.societa }}</td>
            <td><span class="sqbadge">{{ c.squadra }}</span></td>
            <td class="fl-mono">{{ c.settore ?? '–' }}</td>
            <td v-if="org"><select :value="c.stato" :aria-label="t('gare.col.stato')" @change="stato(c, $event.target.value)"><option v-for="s in stati" :key="s" :value="s">{{ t(`gare.stato.${s}`) }}</option></select></td>
            <td v-if="org && !bloccato"><button type="button" class="btn btn-ghost btn-sm" :aria-label="t('common.delete') + ' ' + c.cognome" @click="elimina(c)">✕</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { fipsasApi, leggiCsv } from '../../composables/useFipsas.js'
import { useToast } from '../../composables/useToast.js'

const props = defineProps({ prova: { type: Object, required: true } })
const emit = defineEmits(['cambiato'])
const { t } = useI18n()
const { toast } = useToast()
const org = computed(() => props.prova.ruolo === 'organizer')
const bloccato = computed(() => !!props.prova.sorteggio?.confirmedAt)
const stati = ['presente', 'assente', 'retrocesso', 'escluso']

const info = ref({ concorrenti: [], squadreIncomplete: [], squadreCompleteN: 0, societa: 0, senzaSquadra: 0 })
const filtro = ref('')
const lista = computed(() => {
  const q = filtro.value.trim().toLowerCase()
  return q ? info.value.concorrenti.filter((c) => `${c.cognome} ${c.nome} ${c.societa}`.toLowerCase().includes(q)) : info.value.concorrenti
})
const contatori = computed(() => [
  { n: info.value.concorrenti.length, l: t('gare.iscritti.concorrenti') }, { n: info.value.squadreCompleteN, l: t('gare.iscritti.squadreComplete') },
  { n: info.value.senzaSquadra, l: t('gare.iscritti.senzaSquadra') }, { n: info.value.societa, l: t('gare.iscritti.societa') },
])
async function carica() { info.value = await fipsasApi.concorrenti(props.prova._id) }
onMounted(carica)

const mostraNuovo = ref(false), n = reactive({ cognome: '', nome: '', societa: '', squadra: '*' })
async function aggiungi() {
  try { await fipsasApi.addConcorrente(props.prova._id, n); Object.assign(n, { cognome: '', nome: '', squadra: '*' }); await carica(); emit('cambiato') }
  catch (e) { toast(e.response?.data?.error || t('common.error'), { type: 'danger' }) }
}
async function stato(c, v) {
  try { await fipsasApi.patchConcorrente(props.prova._id, c._id, { stato: v }); c.stato = v; emit('cambiato') } catch (e) { toast(e.response?.data?.error || t('common.error'), { type: 'danger' }) }
}
async function elimina(c) {
  try { await fipsasApi.delConcorrente(props.prova._id, c._id); await carica(); emit('cambiato') } catch (e) { toast(e.response?.data?.error || t('common.error'), { type: 'danger' }) }
}

const mostraCsv = ref(false), csv = ref(''), prev = ref(null)
function leggiFile(e) { const file = e.target.files?.[0]; if (!file) return; file.text().then((tx) => { csv.value = tx; anteprima() }) }
async function anteprima() {
  const rows = leggiCsv(csv.value)
  prev.value = rows.length ? await fipsasApi.importa(props.prova._id, rows, true).catch((e) => ({ validi: 0, errori: [{ riga: 0, errore: e.response?.data?.error || t('common.error') }] })) : null
}
async function conferma() {
  try {
    const r = await fipsasApi.importa(props.prova._id, leggiCsv(csv.value), false)
    toast(t('gare.iscritti.importati', { n: r.importati }), { type: 'success' })
    csv.value = ''; prev.value = null; mostraCsv.value = false; await carica(); emit('cambiato')
  } catch (e) { toast(e.response?.data?.error || t('common.error'), { type: 'danger' }) }
}
</script>

<style scoped>
.stat { padding: 12px; text-align: center; } .stat-n { font-size: 24px; font-weight: 700; }
.avviso { border: 1px solid rgb(var(--color-sand)); background: rgb(var(--color-sand) / .1); border-radius: 12px; padding: 10px 12px; font-size: 13px; }
.tbl-wrap { overflow-x: auto; } .tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
.tbl th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: rgb(var(--color-muted)); padding: 8px; border-bottom: 1px solid rgb(var(--color-border)); }
.tbl td { padding: 8px; border-bottom: 1px solid rgb(var(--color-border) / .6); } .tbl .num { text-align: right; }
.sqbadge { display: inline-block; min-width: 24px; text-align: center; border: 1px solid rgb(var(--color-border-light)); border-radius: 6px; font-weight: 700; font-size: 12px; }
.state-empty { padding: 24px; text-align: center; color: rgb(var(--color-muted)); border: 1px dashed rgb(var(--color-border)); border-radius: 16px; }
</style>
