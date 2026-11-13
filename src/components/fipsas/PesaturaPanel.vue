<template>
  <section>
    <div v-if="!online || inCoda" class="banner" :class="{ off: !online }" role="status">
      <WifiOff v-if="!online" :size="16" aria-hidden="true" />
      <span v-if="!online">{{ t('gare.pesatura.offline') }}</span>
      <span v-if="inCoda">{{ t('gare.pesatura.inCoda', { n: inCoda }) }}</span>
    </div>

    <p v-if="!sorteggiata" class="state-empty">{{ t('gare.pesatura.senzaSorteggio') }}</p>
    <template v-else-if="settori.length">
      <div class="flex items-center gap-2 mb-3 flex-wrap">
        <div class="flex gap-2 overflow-x-auto" role="tablist" :aria-label="t('gare.settore')" @keydown="frecce">
          <button v-for="s in settori" :key="s.lettera" type="button" role="tab" class="pill fl-mono" :class="{ on: corrente === s.lettera }"
            :aria-selected="corrente === s.lettera" :tabindex="corrente === s.lettera ? 0 : -1" :aria-label="t('gare.settoreN', { l: s.lettera })" @click="corrente = s.lettera">{{ s.lettera }}</button>
        </div>
        <span class="fl-mono text-xs text-muted">{{ t('gare.pesatura.pesati', { a: sett.pesati, b: sett.totale }) }}</span>
        <span v-if="sett.chiuso" class="tag ok">{{ t('gare.pesatura.chiuso') }}</span>
        <button v-if="giudice && !sett.chiuso" class="btn btn-primary ml-auto" :disabled="!!inCoda" @click="chiudi">{{ t('gare.pesatura.chiudi') }}</button>
        <button v-else-if="giudice && sett.chiuso" class="btn btn-secondary ml-auto" @click="riapri">{{ t('gare.pesatura.riapri') }}</button>
      </div>

      <ul class="righe" :aria-label="t('gare.pesatura.elenco', { l: corrente })">
        <li v-for="r in righeVista" :key="r.id">
          <component :is="puoModificare ? 'button' : 'div'" class="riga" :class="{ sel: edit?.id === r.id, ex: r.stato !== 'presente' }" :type="puoModificare ? 'button' : undefined" @click="puoModificare && apri(r)">
            <span class="gara fl-mono">{{ r.gara }}</span>
            <span class="nome"><strong>{{ r.cognome }} {{ r.nome }}</strong>
              <small>{{ r.pesato ? t('gare.pesatura.riga', { c: r.catture, g: r.grammi, b: r.bonus }) : (r.stato !== 'presente' ? t(`gare.stato.${r.stato}`) : t('gare.pesatura.nonPesato')) }}</small></span>
            <span class="punti fl-mono">{{ r.pesato ? fmtPunti(r.punteggio) : '–' }}
              <span class="posto-tag" :class="{ top: r.posto === 1 }">{{ r.posto !== null ? t('gare.pesatura.posto', { n: fmtPos(r.posto) }) : '–' }}<template v-if="r.inCoda"> ⏳</template></span></span>
          </component>
        </li>
      </ul>
    </template>

    <BottomSheet v-model="aperto" :label="t('gare.pesatura.risultato')">
      <form v-if="edit" class="foglio" @submit.prevent="salva">
        <h2 class="font-display text-xl"><span class="fl-mono text-ocean-text">{{ edit.gara }}</span> {{ edit.cognome }} {{ edit.nome }}</h2>
        <p class="text-sm text-muted">{{ edit.societa }} · {{ t('gare.squadraN', { s: edit.squadra }) }}</p>

        <div class="campo"><label for="p-catture">{{ t('gare.pesatura.catture') }}</label>
          <div class="stepper">
            <button type="button" :aria-label="t('gare.pesatura.meno')" :disabled="val.catture <= 0" @click="cambia('catture', -1)">−</button>
            <input id="p-catture" v-model.number="val.catture" type="number" inputmode="numeric" min="0" max="999" class="fl-mono" @input="coerenza" />
            <button type="button" :aria-label="t('gare.pesatura.piu')" @click="cambia('catture', 1)">+</button>
          </div></div>
        <div class="campo"><label for="p-valide">{{ t('gare.pesatura.valide') }}</label>
          <div class="stepper">
            <button type="button" :aria-label="t('gare.pesatura.meno')" :disabled="val.catturaValide <= 0" @click="cambia('catturaValide', -1)">−</button>
            <input id="p-valide" v-model.number="val.catturaValide" type="number" inputmode="numeric" min="0" :max="val.catture" class="fl-mono" @input="coerenza(true)" />
            <button type="button" :aria-label="t('gare.pesatura.piu')" :disabled="val.catturaValide >= val.catture" @click="cambia('catturaValide', 1)">+</button>
          </div></div>
        <div class="campo"><label for="p-grammi">{{ t('gare.pesatura.peso') }}</label>
          <input id="p-grammi" v-model.number="val.grammi" type="number" inputmode="numeric" min="0" class="fl-mono grande" /></div>
        <div class="campo"><label for="p-bonus">{{ t('gare.pesatura.bonus') }} <small class="text-muted">{{ manuale ? t('gare.pesatura.manuale') : t('gare.pesatura.auto') }}</small></label>
          <input id="p-bonus" v-model.number="val.bonus" type="number" inputmode="numeric" min="0" class="fl-mono" @input="manuale = true" />
          <button v-if="manuale" type="button" class="btn btn-ghost btn-sm mt-1" @click="ripristinaBonus">{{ t('gare.pesatura.calcolaBonus') }}</button></div>

        <div class="riepilogo" aria-live="polite">
          <div><span>{{ t('gare.col.bonus') }}</span><b class="fl-mono">{{ fmtPunti(val.bonus) }}</b></div>
          <div><span>{{ t('gare.col.punteggio') }}</span><b class="fl-mono">{{ fmtPunti(anteprima.punteggio) }}</b></div>
          <div><span>{{ t('gare.col.posto') }}</span><b class="fl-mono">{{ fmtPos(anteprima.posto) }}</b></div>
        </div>
        <p v-if="errore" class="error-msg" role="alert">{{ errore }}</p>
        <button class="btn btn-primary w-full" :disabled="lavoro">{{ t('common.save') }}</button>
        <button type="button" class="btn btn-secondary w-full mt-2" :disabled="lavoro" @click="cappotto">{{ t('gare.pesatura.cappotto') }}</button>
        <button v-if="edit.pesato" type="button" class="btn btn-ghost w-full mt-2" :disabled="lavoro" @click="annulla">{{ t('gare.pesatura.annulla') }}</button>
      </form>
    </BottomSheet>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { WifiOff } from 'lucide-vue-next'
import BottomSheet from '../motion/BottomSheet.vue'
import { fipsasApi, salvaPesata, fmtPos, fmtPunti } from '../../composables/useFipsas.js'
import { useOfflineStore } from '../../stores/offline.js'
import { useToast } from '../../composables/useToast.js'
import { confirmDialog } from '../../composables/useConfirm.js'
import { classificaSettore, conversione, bonusSuggerito } from '../../shared/fipsas/calc.ts'
import api from '../../utils/api.js'

const props = defineProps({ prova: { type: Object, required: true } })
const emit = defineEmits(['cambiato'])
const { t } = useI18n()
const { toast } = useToast()
const offline = useOfflineStore()

const sorteggiata = computed(() => !!props.prova.sorteggio?.confirmedAt)
const giudice = computed(() => !!props.prova.isJudge)
const online = computed(() => offline.online)
const mie = (i) => i.meta?.kind === 'fipsas-pesata' && i.meta.provaId === props.prova._id
const inCoda = computed(() => offline.outbox.filter((i) => mie(i) && i.status !== 'error').length)

const dati = ref({ settori: [] })
const corrente = ref('A')
// valori scritti in locale (anche offline) in attesa del server: id concorrente -> pesata
const locale = reactive({})
const settori = computed(() => dati.value.settori)
const sett = computed(() => settori.value.find((s) => s.lettera === corrente.value) || { righe: [], pesati: 0, totale: 0, chiuso: false })
const puoModificare = computed(() => giudice.value && !sett.value.chiuso)

async function carica() {
  dati.value = await fipsasApi.classifiche(props.prova._id)
  if (!settori.value.some((s) => s.lettera === corrente.value)) corrente.value = settori.value[0]?.lettera || 'A'
  // pesate ancora in coda: restano visibili finché non arrivano al server
  for (const k of Object.keys(locale)) delete locale[k]
  for (const i of offline.outbox.filter(mie)) locale[i.meta.concorrenteId] = { ...i.data, inCoda: true }
}
onMounted(carica)
watch(inCoda, (n, v) => { if (v > 0 && n === 0) carica() })

const regole = computed(() => props.prova.regole)
const unisci = (r) => {
  const l = locale[r.id]
  if (!l) return r
  const conv = conversione(l.grammi, regole.value)
  return { ...r, pesato: true, catture: l.catture, catturaValide: l.catturaValide, grammi: l.grammi, bonus: l.bonus, conversione: conv, punteggio: conv + l.bonus, inCoda: !!l.inCoda }
}
// posti calcolati in locale con lo stesso calc.ts del server, così si aggiornano mentre si inserisce
function posti(righe, sostituzione) {
  const base = righe.map((r) => (sostituzione && sostituzione.id === r.id ? { ...r, ...sostituzione } : r))
  const inGioco = base.filter((r) => r.stato !== 'presente' || r.pesato || sett.value.chiuso)
  const ris = classificaSettore(inGioco.map((r) => ({ conversione: r.conversione, bonus: r.bonus, catture: r.catture, stato: r.stato })), Math.max(regole.value.concorrentiPerSettore, sett.value.capacita || 0))
  const out = new Map()
  inGioco.forEach((r, i) => out.set(r.id, ris[i].penalita))
  return out
}
const righeVista = computed(() => {
  const righe = sett.value.righe.map(unisci).sort((a, b) => a.gara - b.gara)
  const p = posti(righe)
  return righe.map((r) => ({ ...r, posto: p.get(r.id) ?? null }))
})

// ── editor ───────────────────────────────────────────────────────────────
const aperto = ref(false), edit = ref(null), lavoro = ref(false), errore = ref(''), manuale = ref(false)
const val = reactive({ catture: 0, catturaValide: 0, grammi: 0, bonus: 0 })
function apri(r) {
  edit.value = r; errore.value = ''
  Object.assign(val, { catture: r.catture || 0, catturaValide: r.pesato ? r.catturaValide : 0, grammi: r.grammi || 0, bonus: r.pesato ? r.bonus : 0 })
  manuale.value = r.pesato && r.bonus !== bonusSuggerito(r.catturaValide, regole.value)
  aperto.value = true
}
function coerenza(daValide) {
  val.catture = Math.max(0, Math.floor(val.catture || 0)); val.catturaValide = Math.max(0, Math.floor(val.catturaValide || 0))
  if (!daValide && val.catturaValide > val.catture) val.catturaValide = val.catture
  if (val.catturaValide > val.catture) val.catturaValide = val.catture
}
function cambia(k, d) {
  val[k] = Math.max(0, (val[k] || 0) + d)
  if (k === 'catture' && d > 0 && val.catturaValide === val.catture - 1) val.catturaValide = val.catture   // in genere ogni cattura è valida
  coerenza()
}
// il bonus segue le catture valide finché non lo si scrive a mano
watch(() => val.catturaValide, (v) => { if (!manuale.value) val.bonus = bonusSuggerito(v, regole.value) })
const ripristinaBonus = () => { manuale.value = false; val.bonus = bonusSuggerito(val.catturaValide, regole.value) }
const anteprima = computed(() => {
  if (!edit.value) return { punteggio: 0, posto: null }
  const conv = conversione(val.grammi || 0, regole.value)
  const righe = sett.value.righe.map(unisci)
  const p = posti(righe, { id: edit.value.id, pesato: true, conversione: conv, bonus: val.bonus || 0, catture: val.catture || 0 })
  return { punteggio: conv + (val.bonus || 0), posto: p.get(edit.value.id) ?? null }
})

async function scrivi(valori) {
  lavoro.value = true; errore.value = ''
  try {
    const r = await salvaPesata(props.prova._id, edit.value.id, valori)
    if (r.queued) locale[edit.value.id] = { ...valori, inCoda: true }
    else await carica()
    aperto.value = false
    toast(r.queued ? t('gare.pesatura.inCodaToast') : t('gare.pesatura.salvata'), { type: r.queued ? 'info' : 'success' })
    emit('cambiato')
  } catch (e) { errore.value = e.response?.data?.error || t('common.error') } finally { lavoro.value = false }
}
const salva = () => {
  if (val.catturaValide > val.catture) { errore.value = t('gare.pesatura.validiMaggiori'); return }
  return scrivi({ catture: val.catture, catturaValide: val.catturaValide, grammi: val.grammi || 0, bonus: val.bonus || 0 })
}
const cappotto = () => scrivi({ catture: 0, catturaValide: 0, grammi: 0, bonus: 0 })
async function annulla() {
  if (!(await confirmDialog(t('gare.pesatura.annullaAvviso'), { title: t('gare.pesatura.annulla') }))) return
  try { await api.delete(`/fipsas/${props.prova._id}/pesate/${edit.value.id}`); aperto.value = false; await carica(); emit('cambiato') }
  catch (e) { errore.value = e.response?.data?.error || t('common.error') }
}

async function chiudi() {
  const mancano = sett.value.totale - sett.value.pesati
  const msg = mancano > 0 ? t('gare.pesatura.chiudiAvvisoMancano', { n: mancano }) : t('gare.pesatura.chiudiAvviso')
  if (!(await confirmDialog(msg, { title: t('gare.pesatura.chiudi'), destructive: false, confirmLabel: t('gare.pesatura.chiudi') }))) return
  try { await fipsasApi.chiudiSettore(props.prova._id, corrente.value); await carica(); emit('cambiato') } catch (e) { toast(e.response?.data?.error || t('common.error'), { type: 'danger' }) }
}
async function riapri() {
  try { await fipsasApi.riapriSettore(props.prova._id, corrente.value); await carica(); emit('cambiato') } catch (e) { toast(e.response?.data?.error || t('common.error'), { type: 'danger' }) }
}

function frecce(e) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  const ls = settori.value.map((s) => s.lettera)
  const i = ls.indexOf(corrente.value)
  corrente.value = ls[(i + (e.key === 'ArrowRight' ? 1 : -1) + ls.length) % ls.length]
  e.preventDefault()
  queueMicrotask(() => e.currentTarget.querySelector('[aria-selected=true]')?.focus())
}
</script>

<style scoped>
.banner { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border-radius: 12px; margin-bottom: 12px; font-size: 13px; border: 1px solid rgb(var(--color-border)); background: rgb(var(--color-surface-2)); }
.banner.off { border-color: rgb(var(--color-sand)); background: rgb(var(--color-sand) / .1); }
.pill { min-width: 44px; min-height: 44px; border-radius: 999px; border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-foam)); font-weight: 700; transition: background var(--motion-fast, 120ms); }
.pill.on { background: rgb(var(--color-ocean)); color: rgb(var(--color-on-primary)); border-color: rgb(var(--color-ocean)); }
.pill:focus-visible, .riga:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.tag.ok { font-size: 12px; padding: 2px 8px; border-radius: 8px; border: 1px solid rgb(var(--color-success)); color: rgb(var(--color-success-text)); }
.righe { border-top: 1px solid rgb(var(--color-border)); }
.riga { width: 100%; display: grid; grid-template-columns: 40px 1fr auto; gap: 10px; align-items: center; text-align: left; min-height: 56px; padding: 8px 4px; border-bottom: 1px solid rgb(var(--color-border) / .6); transition: background var(--motion-fast, 120ms); }
button.riga:hover { background: rgb(var(--color-surface-2)); }
.riga.sel { background: rgb(var(--color-ocean) / .12); } .riga.ex { opacity: .7; }
.gara { color: rgb(var(--color-ocean-text)); font-weight: 700; text-align: center; }
.nome { display: grid; } .nome small { color: rgb(var(--color-muted)); font-size: 12px; }
.punti { display: grid; justify-items: end; font-size: 18px; font-weight: 700; }
.posto-tag { font-size: 11px; font-weight: 600; border: 1px solid rgb(var(--color-border-light)); border-radius: 999px; padding: 1px 8px; color: rgb(var(--color-foam)); }
.posto-tag.top { border-color: rgb(var(--color-success)); color: rgb(var(--color-success-text)); }
.foglio { display: grid; gap: 12px; padding: 4px 4px 12px; }
.campo { display: grid; gap: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: rgb(var(--color-muted)); }
.stepper { display: grid; grid-template-columns: 56px 1fr 56px; gap: 8px; }
.stepper button { min-height: 56px; border-radius: 14px; border: 1px solid rgb(var(--color-border)); font-size: 24px; color: rgb(var(--color-foam)); }
.stepper button:disabled { opacity: .4; }
.campo > input, .stepper input, .grande { min-height: 48px; }
.stepper input, .grande { min-height: 56px; text-align: center; font-size: 28px; font-weight: 700; }
.riepilogo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.riepilogo div { background: rgb(var(--color-surface-2)); border-radius: 12px; padding: 8px 10px; display: grid; }
.riepilogo span { font-size: 11px; text-transform: uppercase; color: rgb(var(--color-muted)); } .riepilogo b { font-size: 22px; }
.state-empty { padding: 24px; text-align: center; color: rgb(var(--color-muted)); border: 1px dashed rgb(var(--color-border)); border-radius: 16px; }
</style>
