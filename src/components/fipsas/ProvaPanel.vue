<template>
  <section class="grid gap-4 lg:grid-cols-2">
    <form class="card" @submit.prevent="salva">
      <h2 class="font-display text-lg mb-1">{{ t('gare.prova.dati') }}</h2>
      <p class="text-xs text-muted mb-3">{{ t('gare.prova.datiNota') }}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="f sm:col-span-2">{{ t('gare.prova.organizzazione') }}<input v-model="f.organizzazione" :disabled="!org" maxlength="160" /></label>
        <label class="f sm:col-span-2">{{ t('gare.prova.manifestazione') }}<input v-model="f.manifestazione" :disabled="!org" maxlength="160" required /></label>
        <label class="f">{{ t('gare.prova.numero') }}<input v-model.number="f.provaNumero" type="number" min="1" class="fl-mono" :disabled="!org" required /></label>
        <label class="f">{{ t('gare.prova.data') }}<input v-model="f.data" type="date" class="fl-mono" :disabled="!org" required /></label>
        <label class="f sm:col-span-2">{{ t('gare.prova.campo') }}<input v-model="f.campoDiGara" :disabled="!org" maxlength="160" /></label>
        <label class="f sm:col-span-2">{{ t('gare.prova.societa') }}<input v-model="f.societaOrganizzatrice" :disabled="!org" maxlength="160" /></label>
        <label class="f">{{ t('gare.prova.direttore') }}<input v-model="f.direttoreDiGara" :disabled="!org" maxlength="160" /></label>
        <label class="f">{{ t('gare.prova.giudice') }}<input v-model="f.giudiceDiGara" :disabled="!org" maxlength="160" /></label>
      </div>
      <p v-if="errore" class="error-msg mt-2" role="alert">{{ errore }}</p>
      <div v-if="org" class="flex flex-wrap gap-2 mt-4">
        <button class="btn btn-primary" :disabled="salvando">{{ t('gare.prova.salva') }}</button>
        <button type="button" class="btn btn-secondary" @click="$emit('duplica')">{{ t('gare.prova.duplica') }}</button>
      </div>
    </form>

    <div class="grid gap-4 content-start">
      <form class="card" @submit.prevent="salva">
        <h2 class="font-display text-lg mb-1">{{ t('gare.prova.regole') }}</h2>
        <p class="text-xs text-muted mb-3">{{ t('gare.prova.regoleNota') }}</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="f">{{ t('gare.prova.perSettore') }}<input v-model.number="f.regole.concorrentiPerSettore" type="number" min="2" max="40" class="fl-mono" :disabled="!org || sorteggiata" /></label>
          <label class="f">{{ t('gare.prova.perSquadra') }}<input v-model.number="f.regole.componentiPerSquadra" type="number" min="1" max="10" class="fl-mono" :disabled="!org" /></label>
          <label class="f">{{ t('gare.prova.grammiPerPunto') }}<input v-model.number="f.regole.grammiPerPunto" type="number" step="any" min="0.01" class="fl-mono" :disabled="!org" /></label>
          <label class="f">{{ t('gare.prova.bonus') }}<input v-model.number="f.regole.bonusPerCattura" type="number" min="30" max="100" class="fl-mono" :disabled="!org" /></label>
        </div>
        <ul class="regole mt-3">
          <li>{{ t('gare.prova.rPenalita') }}</li>
          <li>{{ t('gare.prova.rPari') }}</li>
          <li>{{ t('gare.prova.rCappotto') }}</li>
          <li>{{ t('gare.prova.rAssente') }}</li>
        </ul>
        <div class="avviso mt-3" role="note">
          <strong>{{ t('gare.daConfermare.titolo') }}</strong>
          <ul><li v-for="k in daConfermare" :key="k">{{ t(`gare.daConfermare.${k}`) }}</li></ul>
        </div>
        <button v-if="org" class="btn btn-primary mt-3" :disabled="salvando">{{ t('gare.prova.salva') }}</button>
      </form>

      <div class="card">
        <h2 class="font-display text-lg mb-1">{{ t('gare.giudici.titolo') }}</h2>
        <p class="text-xs text-muted mb-3">{{ t('gare.giudici.nota') }}</p>
        <ul class="mb-3">
          <li v-for="g in giudici" :key="g._id" class="flex items-center justify-between py-1">
            <span>{{ g.displayName }}</span>
            <button v-if="org" type="button" class="btn btn-ghost btn-sm" @click="rimuovi(g)">{{ t('gare.giudici.rimuovi') }}</button>
          </li>
          <li v-if="!giudici.length" class="text-sm text-muted">{{ t('gare.giudici.nessuno') }}</li>
        </ul>
        <div v-if="org">
          <label class="f">{{ t('gare.giudici.cerca') }}<input v-model="ricerca" type="search" @input="cerca" /></label>
          <ul v-if="trovati.length" class="mt-2">
            <li v-for="u in trovati" :key="u._id" class="flex items-center justify-between py-1">
              <span>{{ u.displayName }}</span>
              <button type="button" class="btn btn-secondary btn-sm" @click="aggiungi(u)">{{ t('common.add') }}</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../utils/api.js'
import { fipsasApi } from '../../composables/useFipsas.js'
import { useToast } from '../../composables/useToast.js'

const props = defineProps({ prova: { type: Object, required: true } })
const emit = defineEmits(['aggiornata', 'duplica'])
const { t } = useI18n()
const { toast } = useToast()

const org = computed(() => props.prova.ruolo === 'organizer')
const sorteggiata = computed(() => !!props.prova.sorteggio?.confirmedAt)
const daConfermare = ['bonus-per-catture-valide', 'conversione-da-tabella-cm', 'cappotto-con-assenti', 'settore-tecnico', 'riserve-di-squadra', 'scarti-nelle-selettive', 'spareggio-squadre-per-prova']

const leggi = (p) => ({
  organizzazione: p.organizzazione, manifestazione: p.manifestazione, provaNumero: p.provaNumero, data: String(p.data).slice(0, 10),
  campoDiGara: p.campoDiGara, societaOrganizzatrice: p.societaOrganizzatrice, direttoreDiGara: p.direttoreDiGara, giudiceDiGara: p.giudiceDiGara,
  regole: { ...p.regole },
})
const f = reactive(leggi(props.prova))
watch(() => props.prova, (p) => Object.assign(f, leggi(p)))

const salvando = ref(false), errore = ref('')
async function salva() {
  salvando.value = true; errore.value = ''
  try {
    const body = { ...f }
    if (sorteggiata.value) body.regole = { ...f.regole, concorrentiPerSettore: undefined }
    emit('aggiornata', await fipsasApi.patch(props.prova._id, body))
    toast(t('gare.prova.salvata'), { type: 'success' })
  } catch (e) { errore.value = e.response?.data?.error || t('common.error') } finally { salvando.value = false }
}

// giudici: elenco corrente dal server, ricerca utenti con l'endpoint già usato per amici e gruppi
const giudici = ref([...(props.prova.giudiciElenco || [])])
watch(() => props.prova.giudiciElenco, (g) => { giudici.value = [...(g || [])] })
const ricerca = ref(''), trovati = ref([])
let timer
function cerca() {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    if (ricerca.value.trim().length < 2) { trovati.value = []; return }
    const { data } = await api.get('/users', { params: { search: ricerca.value.trim() } })
    trovati.value = (data.data || []).filter((u) => !giudici.value.some((g) => g._id === u._id))
  }, 300)
}
async function salvaGiudici(lista) {
  try {
    await fipsasApi.giudici(props.prova._id, lista.map((g) => g._id))
    giudici.value = lista
    emit('aggiornata', await fipsasApi.get(props.prova._id))
  } catch (e) { toast(e.response?.data?.error || t('common.error'), { type: 'danger' }) }
}
const aggiungi = (u) => { trovati.value = []; ricerca.value = ''; salvaGiudici([...giudici.value, u]) }
const rimuovi = (g) => salvaGiudici(giudici.value.filter((x) => x._id !== g._id))
</script>

<style scoped>
.f { display: grid; gap: 4px; font-size: 12px; color: rgb(var(--color-muted)); }
.f input { min-height: 44px; }
.regole { font-size: 13px; color: rgb(var(--color-muted)); display: grid; gap: 4px; list-style: disc; padding-left: 18px; }
.avviso { border: 1px solid rgb(var(--color-sand)); background: rgb(var(--color-sand) / .1); border-radius: 12px; padding: 10px 12px; font-size: 13px; }
.avviso ul { list-style: disc; padding-left: 18px; margin-top: 4px; color: rgb(var(--color-muted)); }
</style>
