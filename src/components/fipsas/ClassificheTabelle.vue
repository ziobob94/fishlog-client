<template>
  <section>
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <div role="tablist" :aria-label="t('gare.classifiche.titolo')" class="seg" @keydown="frecce($event, vistaIds, v => (vista = v))">
        <button v-for="v in viste" :id="`vista-${v.id}`" :key="v.id" type="button" role="tab" class="seg-btn"
          :class="{ on: vista === v.id }" :aria-selected="vista === v.id" :tabindex="vista === v.id ? 0 : -1" @click="vista = v.id">{{ v.label }}</button>
      </div>
      <slot name="azioni" />
    </div>

    <p v-if="data.aggiornato" class="text-xs text-muted mb-2">{{ t('gare.classifiche.aggiornata', { ora: ora }) }}</p>

    <!-- Settore: scelta lettera -->
    <div v-if="vista === 'settore' && data.settori.length" class="flex gap-2 mb-3 overflow-x-auto" role="tablist" :aria-label="t('gare.settore')" @keydown="frecce($event, lettere, l => (lettera = l))">
      <button v-for="s in data.settori" :key="s.lettera" type="button" role="tab" class="pill fl-mono" :class="{ on: lettera === s.lettera }"
        :aria-selected="lettera === s.lettera" :tabindex="lettera === s.lettera ? 0 : -1" :aria-label="t('gare.settoreN', { l: s.lettera })" @click="lettera = s.lettera">{{ s.lettera }}</button>
    </div>

    <p v-if="vuoto" class="state-empty">{{ t('gare.classifiche.vuoto') }}</p>

    <!-- Settore -->
    <div v-else-if="vista === 'settore'" class="tbl-wrap">
      <table class="tbl">
        <caption class="sr-only">{{ titoli.settore || t('gare.classifiche.settoreTitolo', { l: lettera }) }}</caption>
        <thead><tr>
          <th scope="col" class="num">{{ t('gare.col.posto') }}</th><th scope="col" class="num hide-sm">{{ t('gare.col.gara') }}</th><th scope="col">{{ t('gare.col.concorrente') }}</th>
          <th scope="col" class="hide-sm">{{ t('gare.col.societa') }}</th><th scope="col" class="num hide-sm">{{ t('gare.col.conversione') }}</th><th scope="col" class="num hide-sm">{{ t('gare.col.catture') }}</th>
          <th scope="col" class="num hide-sm">{{ t('gare.col.bonus') }}</th><th scope="col" class="num">{{ t('gare.col.punteggio') }}</th><th scope="col" class="num hide-sm">{{ t('gare.col.penalita') }}</th><th scope="col" class="hide-sm">{{ t('gare.col.sq') }}</th>
        </tr></thead>
        <tbody>
          <tr v-for="r in settoreCorrente.righe" :key="r.id" :class="{ me: r.id === meId }">
            <td class="num"><span class="posto fl-mono">{{ fmtPos(r.penalita) }}</span><span v-if="ex(r.penalita)" class="tag">{{ t('gare.exaequo') }}</span><span v-if="r.cappotto" class="tag">{{ t('gare.cappotto') }}</span><span v-if="r.stato !== 'presente'" class="tag">{{ t(`gare.stato.${r.stato}`) }}</span></td>
            <td class="num fl-mono hide-sm">{{ r.gara }}</td>
            <td>{{ r.cognome }} {{ r.nome }}<div class="sub show-sm">{{ t('gare.classifiche.sottoRiga', { g: r.gara, c: r.catture, b: fmtPunti(r.bonus), s: r.squadra }) }}</div></td>
            <td class="hide-sm">{{ r.societa }}</td>
            <td class="num fl-mono hide-sm">{{ fmtPunti(r.conversione) }}</td>
            <td class="num fl-mono hide-sm">{{ r.catture }}</td>
            <td class="num fl-mono hide-sm">{{ fmtPunti(r.bonus) }}</td>
            <td class="num fl-mono">{{ fmtPunti(r.punteggio) }}</td>
            <td class="num fl-mono hide-sm">{{ fmtPos(r.penalita) }}</td>
            <td class="hide-sm">{{ r.squadra }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Giornata -->
    <div v-else-if="vista === 'giornata'" class="tbl-wrap">
      <table class="tbl">
        <caption class="sr-only">{{ titoli.giornata || t('gare.classifiche.giornata') }}</caption>
        <thead><tr><th scope="col" class="num">{{ t('gare.col.class') }}</th><th scope="col">{{ t('gare.col.cognome') }}</th><th scope="col" class="hide-sm">{{ t('gare.col.nome') }}</th>
          <th scope="col" class="hide-sm">{{ t('gare.col.societa') }}</th><th scope="col" class="num">{{ t('gare.col.penEff') }}</th><th scope="col" class="num">{{ t('gare.col.peso') }}</th></tr></thead>
        <tbody>
          <tr v-for="r in data.giornata" :key="r.id" :class="{ me: r.id === meId }">
            <td class="num"><span class="posto fl-mono">{{ r.classe }}</span></td>
            <td>{{ r.cognome }}<span class="show-sm"> {{ r.nome }}</span><div class="sub show-sm">{{ r.societa }}</div></td>
            <td class="hide-sm">{{ r.nome }}</td><td class="hide-sm">{{ r.societa }}</td>
            <td class="num fl-mono">{{ fmtPos(r.penalita) }}</td><td class="num fl-mono">{{ fmtPunti(r.punteggio) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="legenda">{{ t('gare.classifiche.ordineGiornata') }}</p>
    </div>

    <!-- Progressiva individuale -->
    <div v-else-if="vista === 'progressiva'" class="tbl-wrap">
      <table class="tbl">
        <caption class="sr-only">{{ titoli.progressiva || t('gare.classifiche.progressiva') }}</caption>
        <thead><tr><th scope="col" class="num">{{ t('gare.col.class') }}</th><th scope="col">{{ t('gare.col.concorrente') }}</th><th scope="col" class="hide-sm">{{ t('gare.col.societa') }}</th>
          <th scope="col" class="num">{{ t('gare.col.piazzTot') }}</th><th scope="col" class="num">{{ t('gare.col.piazzProve') }}</th><th scope="col" class="num hide-sm">{{ t('gare.col.punteggioTot') }}</th><th scope="col" class="num hide-sm">{{ t('gare.col.catturaTot') }}</th></tr></thead>
        <tbody>
          <tr v-for="r in data.progressiva" :key="r.classe + r.cognome + r.nome">
            <td class="num"><span class="posto fl-mono">{{ r.classe }}</span></td>
            <td>{{ r.cognome }} {{ r.nome }}<div class="sub show-sm">{{ r.societa }}</div></td><td class="hide-sm">{{ r.societa }}</td>
            <td class="num fl-mono">{{ fmtPos(r.piazzTot) }}</td><td class="num fl-mono">{{ r.piazzProve.map(fmtPos).join(' - ') }}</td>
            <td class="num fl-mono hide-sm">{{ fmtPunti(r.punteggioTot) }}</td><td class="num fl-mono hide-sm">{{ r.catture }}</td>
          </tr>
        </tbody>
      </table>
      <p class="legenda">{{ t('gare.classifiche.ordineProgressiva') }}</p>
    </div>

    <!-- Progressiva squadre -->
    <div v-else-if="vista === 'squadre'" class="tbl-wrap">
      <table class="tbl">
        <caption class="sr-only">{{ titoli.squadre || t('gare.classifiche.squadre') }}</caption>
        <thead><tr><th scope="col" class="num">{{ t('gare.col.class') }}</th><th scope="col">{{ t('gare.col.societa') }}</th><th scope="col">{{ t('gare.col.sq') }}</th>
          <th scope="col" class="num">{{ t('gare.col.penEffShort') }}</th><th scope="col" class="num hide-sm">{{ t('gare.col.penProve') }}</th><th scope="col" class="num">{{ t('gare.col.pesoTot') }}</th></tr></thead>
        <tbody>
          <tr v-for="r in data.squadre" :key="r.classe + r.societa + r.squadra">
            <td class="num"><span class="posto fl-mono">{{ r.classe }}</span></td>
            <td>{{ r.societa }}<span v-if="r.incompleta" class="tag warn">{{ t('gare.squadraIncompleta') }}</span><div class="sub show-sm fl-mono">{{ r.penaliteProve.map(fmtPos).join(' - ') }}</div></td>
            <td><span class="sqbadge">{{ r.squadra }}</span></td>
            <td class="num fl-mono">{{ fmtPos(r.penalita) }}</td><td class="num fl-mono hide-sm">{{ r.penaliteProve.map(fmtPos).join(' - ') }}</td><td class="num fl-mono">{{ fmtPunti(r.peso) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="legenda">{{ t('gare.classifiche.ordineSquadre') }}</p>
    </div>

    <!-- Settori pieni -->
    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="s in data.settori" :key="s.lettera" class="card">
        <h3 class="font-display text-base mb-1">{{ t('gare.settoreN', { l: s.lettera }) }} <span class="fl-mono text-xs text-muted">{{ s.totale }}/{{ s.capacita }}</span></h3>
        <ol class="text-sm">
          <li v-for="r in [...s.righe].sort((a, b) => a.gara - b.gara)" :key="r.id" class="flex gap-2"><span class="fl-mono text-muted w-7 text-right">{{ r.gara }}</span>{{ r.cognome }} {{ r.nome }}</li>
        </ol>
      </div>
    </div>

    <p class="legenda">{{ t('gare.classifiche.legenda') }}</p>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fmtPos, fmtPunti } from '../../utils/fipsas.js'

// Le quattro classifiche (settore, giornata, progressiva individuale, progressiva squadre) più «settori pieni».
// Usata sia nell'area riservata sia nella pagina pubblica: riceve solo i dati calcolati dal server.
const props = defineProps({ data: { type: Object, required: true }, titoli: { type: Object, default: () => ({}) }, meId: { type: String, default: '' }, inizio: { type: String, default: 'settore' } })
const { t } = useI18n()

const vista = ref(props.inizio)
const lettera = ref(props.data.settori?.[0]?.lettera || 'A')
watch(() => props.data, (d) => { if (!d.settori?.some((s) => s.lettera === lettera.value)) lettera.value = d.settori?.[0]?.lettera || 'A' })

const viste = computed(() => [
  { id: 'settore', label: t('gare.classifiche.tabSettore') }, { id: 'giornata', label: t('gare.classifiche.tabGiornata') },
  { id: 'progressiva', label: t('gare.classifiche.tabProgressiva') }, { id: 'squadre', label: t('gare.classifiche.tabSquadre') },
  { id: 'pieni', label: t('gare.classifiche.tabPieni') },
])
const vistaIds = computed(() => viste.value.map((v) => v.id))
const lettere = computed(() => props.data.settori.map((s) => s.lettera))
const settoreCorrente = computed(() => props.data.settori.find((s) => s.lettera === lettera.value) || { righe: [] })
const ora = computed(() => (props.data.aggiornato ? new Date(props.data.aggiornato).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''))
const vuoto = computed(() => {
  if (vista.value === 'pieni') return false
  if (vista.value === 'settore') return !settoreCorrente.value.righe.some((r) => r.pesato || r.stato !== 'presente')
  if (vista.value === 'giornata') return !props.data.giornata.length
  if (vista.value === 'progressiva') return !props.data.progressiva.length
  return !props.data.squadre.length
})
// pari merito: stesso posto medio mostrato a più concorrenti (es. 4,5)
const ex = (p) => p !== null && Number.isFinite(p) && !Number.isInteger(p)

// frecce sinistra/destra tra le schede (navigazione da tastiera a livello di sezione)
function frecce(e, ids, set) {
  const k = e.key
  if (k !== 'ArrowRight' && k !== 'ArrowLeft') return
  const cur = ids.indexOf(e.target.closest('[role=tab]')?.id.replace('vista-', '') ?? e.target.textContent.trim())
  const i = cur >= 0 ? cur : 0
  const next = ids[(i + (k === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length]
  set(next)
  e.preventDefault()
  queueMicrotask(() => e.currentTarget.querySelector('[aria-selected=true]')?.focus())
}
</script>

<style scoped>
.seg { display: inline-flex; background: rgb(var(--color-surface-2)); border: 1px solid rgb(var(--color-border)); border-radius: 14px; padding: 3px; overflow-x: auto; max-width: 100%; }
.seg-btn { min-height: 44px; padding: 0 14px; border-radius: 11px; font-size: 14px; font-weight: 600; color: rgb(var(--color-muted)); white-space: nowrap; transition: background var(--motion-fast, 120ms), color var(--motion-fast, 120ms); }
.seg-btn.on { background: rgb(var(--color-ocean)); color: rgb(var(--color-on-primary)); }
.seg-btn:focus-visible, .pill:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.pill { min-width: 44px; min-height: 44px; border-radius: 999px; border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-foam)); font-weight: 700; transition: background var(--motion-fast, 120ms); }
.pill.on { background: rgb(var(--color-ocean)); color: rgb(var(--color-on-primary)); border-color: rgb(var(--color-ocean)); }
.tbl-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
.tbl th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: rgb(var(--color-muted)); padding: 8px 8px; border-bottom: 1px solid rgb(var(--color-border)); white-space: nowrap; }
.tbl td { padding: 10px 8px; border-bottom: 1px solid rgb(var(--color-border) / .6); vertical-align: top; }
.tbl .num { text-align: right; }
.tbl tr.me td { background: rgb(var(--color-ocean) / .12); }
.posto { display: inline-flex; min-width: 30px; height: 30px; padding: 0 6px; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid rgb(var(--color-border-light)); font-weight: 700; }
.tag { display: inline-block; margin-left: 6px; font-size: 11px; padding: 1px 6px; border-radius: 6px; border: 1px dashed rgb(var(--color-sand-text)); color: rgb(var(--color-sand-text)); }
.tag.warn { border-color: rgb(var(--color-danger-text)); color: rgb(var(--color-danger-text)); }
.sqbadge { display: inline-block; min-width: 24px; text-align: center; border: 1px solid rgb(var(--color-border-light)); border-radius: 6px; font-weight: 700; font-size: 12px; }
.sub { font-size: 12px; color: rgb(var(--color-muted)); }
.legenda { font-size: 12px; color: rgb(var(--color-muted)); margin-top: 10px; }
.state-empty { padding: 24px; text-align: center; color: rgb(var(--color-muted)); border: 1px dashed rgb(var(--color-border)); border-radius: 16px; }
.show-sm { display: none; }
@media (max-width: 720px) { .hide-sm { display: none; } .show-sm { display: block; } }
</style>
