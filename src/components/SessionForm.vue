<template>
  <form @submit.prevent="handleSubmit" class="session-form">

    <!-- BASE -->
    <div class="section-divider">📋 Dati uscita</div>
    <div class="form-grid">
      <div class="form-group full">
        <label>Titolo (opzionale)</label>
        <input v-model="f.title" type="text" placeholder="es. Alba alla foce, Uscita notturna..." />
      </div>
      <div class="form-group">
        <label>Data *</label>
        <input v-model="f.date" type="date" required />
      </div>
      <div class="form-group">
        <label>Ora inizio</label>
        <input v-model="f.startTime" type="time" />
      </div>
      <div class="form-group">
        <label>Ora fine</label>
        <input v-model="f.endTime" type="time" />
      </div>
      <div class="form-group">
        <label>Tecnica</label>
        <select v-model="f.technique">
          <option value="">-- Seleziona --</option>
          <option v-for="t in TECHNIQUES" :key="t.v" :value="t.v">{{ t.l }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Voto uscita</label>
        <div class="star-row">
          <button v-for="n in 5" :key="n" type="button"
            class="star-btn" :class="{ active: n <= f.rating }"
            @click="f.rating = f.rating === n ? 0 : n">★</button>
        </div>
      </div>
    </div>

    <!-- LUOGO -->
    <div class="section-divider">📍 Luogo</div>
    <div class="form-grid">
      <div class="form-group">
        <label>Nome luogo *</label>
        <input v-model="f.location.name" type="text" placeholder="es. Foce Arno, Marina di Pisa" required />
      </div>
      <div class="form-group">
        <label>Spot / Soprannome</label>
        <input v-model="f.location.spot" type="text" placeholder="es. Punta della Rena" />
      </div>
      <div class="form-group">
        <label>Regione / Area</label>
        <input v-model="f.location.region" type="text" placeholder="es. Toscana" />
      </div>
      <div class="form-group">
        <label>Latitudine</label>
        <input v-model.number="f.location.coords.lat" type="number" step="0.000001" placeholder="43.123456" />
      </div>
      <div class="form-group">
        <label>Longitudine</label>
        <input v-model.number="f.location.coords.lng" type="number" step="0.000001" placeholder="10.123456" />
      </div>
      <div class="form-group full">
        <label>Note luogo</label>
        <textarea v-model="f.location.notes" placeholder="Accesso, parcheggio, fondo, caratteristiche..." rows="2" />
      </div>
    </div>

    <!-- MARE -->
    <div class="section-divider">🌊 Condizioni mare</div>
    <div class="form-grid">
      <div class="form-group">
        <label>Stato mare</label>
        <select v-model="f.sea.seaState">
          <option value="">--</option>
          <option v-for="s in SEA_STATES" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Altezza onde</label>
        <input v-model="f.sea.waveHeight" type="text" placeholder="es. 0.5-1m" />
      </div>
      <div class="form-group">
        <label>Periodo onde</label>
        <input v-model="f.sea.wavePeriod" type="text" placeholder="es. 6s" />
      </div>
      <div class="form-group">
        <label>Corrente</label>
        <input v-model="f.sea.current" type="text" placeholder="es. corrente da nord" />
      </div>
      <div class="form-group">
        <label>Colore acqua</label>
        <input v-model="f.sea.waterColor" type="text" placeholder="es. torbida, verde, limpida" />
      </div>
      <div class="form-group">
        <label>Temp. acqua (°C)</label>
        <input v-model.number="f.sea.waterTemp" type="number" step="0.5" />
      </div>
      <div class="form-group">
        <label>Marea</label>
        <select v-model="f.sea.tide.state">
          <option value="">--</option>
          <option v-for="t in TIDE_STATES" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Note marea</label>
        <input v-model="f.sea.tide.notes" type="text" placeholder="es. bassa alle 06:30" />
      </div>
    </div>

    <!-- METEO -->
    <div class="section-divider">☀️ Meteo</div>
    <div class="form-grid">
      <div class="form-group">
        <label>Condizione</label>
        <select v-model="f.weather.condition">
          <option value="">--</option>
          <option v-for="c in WEATHER" :key="c.v" :value="c.v">{{ c.l }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Vento direzione</label>
        <input v-model="f.weather.windDirection" type="text" placeholder="es. Libeccio, NE, Tramontana" />
      </div>
      <div class="form-group">
        <label>Velocità vento (km/h)</label>
        <input v-model.number="f.weather.windSpeed" type="number" min="0" />
      </div>
      <div class="form-group">
        <label>Temp. aria (°C)</label>
        <input v-model.number="f.weather.tempAir" type="number" step="0.5" />
      </div>
      <div class="form-group">
        <label>Pressione (hPa)</label>
        <input v-model.number="f.weather.pressure" type="number" />
      </div>
      <div class="form-group full">
        <label>Note meteo</label>
        <textarea v-model="f.weather.notes" placeholder="Osservazioni..." rows="2" />
      </div>
    </div>

    <!-- ESCHE -->
    <div class="section-divider">🪱 Esche</div>
    <div v-for="(bait, i) in f.baits" :key="i" class="sub-block card">
      <div class="sub-header">
        <strong>Esca {{ i + 1 }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="f.baits.splice(i,1)">✕ Rimuovi</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nome *</label>
          <input v-model="bait.name" type="text" placeholder="es. Arenicola, Calamaro, Americano" required />
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select v-model="bait.type">
            <option value="">--</option>
            <option value="naturale">Naturale</option>
            <option value="artificiale">Artificiale</option>
            <option value="misto">Misto</option>
          </select>
        </div>
        <div class="form-group">
          <label>Presentazione</label>
          <input v-model="bait.presentation" type="text" placeholder="es. intera, a pezzi, scalata" />
        </div>
        <div class="form-group">
          <label>Note</label>
          <input v-model="bait.notes" type="text" placeholder="Fresca, surgelata, conservata..." />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm" @click="f.baits.push(emptyBait())">+ Aggiungi esca</button>

    <!-- MONTATURE -->
    <div class="section-divider">🪝 Montature</div>
    <div v-for="(rig, i) in f.rigs" :key="i" class="sub-block card">
      <div class="sub-header">
        <strong>Montatura {{ i + 1 }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="f.rigs.splice(i,1)">✕ Rimuovi</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nome *</label>
          <input v-model="rig.name" type="text" placeholder="es. Paternoster, Piombo fisso" required />
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <input v-model="rig.type" type="text" placeholder="es. surfcasting, feeder" />
        </div>
        <div class="form-group">
          <label>Misura amo</label>
          <input v-model="rig.hookSize" type="text" placeholder="es. 1/0, 2, 4" />
        </div>
        <div class="form-group">
          <label>Tipo amo</label>
          <input v-model="rig.hookType" type="text" placeholder="es. Aberdeen, Limerick" />
        </div>
        <div class="form-group">
          <label>Piombo (g)</label>
          <input v-model.number="rig.sinkerWeight" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>Tipo piombo</label>
          <input v-model="rig.sinkerType" type="text" placeholder="es. ancora, fisso, sgancio" />
        </div>
        <div class="form-group">
          <label>Filo principale (lb)</label>
          <input v-model.number="rig.lineMainLb" type="number" step="0.1" min="0" />
        </div>
        <div class="form-group">
          <label>Terminale (lb)</label>
          <input v-model.number="rig.leaderLb" type="number" step="0.1" min="0" />
        </div>
        <div class="form-group">
          <label>Girella</label>
          <input v-model="rig.swivel" type="text" placeholder="es. rolling n°8" />
        </div>
        <div class="form-group full">
          <label>Note</label>
          <input v-model="rig.notes" type="text" placeholder="Dettagli costruzione, materiali..." />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm" @click="f.rigs.push(emptyRig())">+ Aggiungi montatura</button>

    <!-- LANCI -->
    <div class="section-divider">🎯 Lanci e distanze</div>
    <div v-for="(cast, i) in f.casts" :key="i" class="sub-block card">
      <div class="sub-header">
        <strong>Lancio {{ i + 1 }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="f.casts.splice(i,1)">✕ Rimuovi</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Distanza (m)</label>
          <input v-model.number="cast.distance" type="number" min="0" placeholder="es. 80" />
        </div>
        <div class="form-group">
          <label>Direzione</label>
          <input v-model="cast.direction" type="text" placeholder="es. parallela costa, 45° nord" />
        </div>
        <div class="form-group">
          <label>Montatura usata</label>
          <input v-model="cast.rig" type="text" placeholder="nome montatura" />
        </div>
        <div class="form-group">
          <label>Esca usata</label>
          <input v-model="cast.bait" type="text" placeholder="nome esca" />
        </div>
        <div class="form-group">
          <label>Risultato</label>
          <select v-model="cast.result">
            <option value="">--</option>
            <option value="cattura">Cattura</option>
            <option value="abboccata">Abboccata</option>
            <option value="niente">Niente</option>
          </select>
        </div>
        <div class="form-group">
          <label>Note</label>
          <input v-model="cast.notes" type="text" placeholder="Osservazioni lancio" />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm" @click="f.casts.push(emptyCast())">+ Aggiungi lancio</button>

    <!-- CATTURE -->
    <div class="section-divider">🐟 Catture</div>
    <div v-for="(c, i) in f.catches" :key="i" class="sub-block card">
      <div class="sub-header">
        <strong>Cattura {{ i + 1 }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="f.catches.splice(i,1)">✕ Rimuovi</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Specie *</label>
          <input v-model="c.species" type="text" placeholder="es. Spigola, Orate, Rombo" required />
        </div>
        <div class="form-group">
          <label>Peso (kg)</label>
          <input v-model.number="c.weightKg" type="number" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label>Lunghezza (cm)</label>
          <input v-model.number="c.lengthCm" type="number" step="0.5" min="0" />
        </div>
        <div class="form-group">
          <label>Ora cattura</label>
          <input v-model="c.time" type="time" />
        </div>
        <div class="form-group">
          <label>Distanza (m)</label>
          <input v-model.number="c.distance" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>Rilasciata</label>
          <select v-model="c.released">
            <option :value="false">No (tenuta)</option>
            <option :value="true">Sì (rilasciata)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Esca usata</label>
          <input v-model="c.baitUsed" type="text" />
        </div>
        <div class="form-group">
          <label>Montatura usata</label>
          <input v-model="c.rigUsed" type="text" />
        </div>
        <div class="form-group full">
          <label>Note</label>
          <input v-model="c.notes" type="text" placeholder="Dove esattamente, canna usata..." />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm" @click="f.catches.push(emptyCatch())">+ Aggiungi cattura</button>

    <div class="form-group">
      <label>Visibilità</label>
      <select v-model="f.visibility">
        <option value="private">🔒 Solo io</option>
        <option value="users">👥 Tutti gli utenti</option>
        <option value="group">🫂 Gruppi specifici</option>
      </select>
    </div>

    <!-- mostrato solo se visibility === 'group' -->
    <div v-if="f.visibility === 'group'" class="form-group full">
      <label>Gruppi autorizzati</label>
      <div class="group-checkboxes">
        <label v-for="g in groups" :key="g._id" class="group-check">
          <input type="checkbox" :value="g._id" v-model="f.allowedGroups" />
          {{ g.name }}
        </label>
        <span v-if="!groups.length" class="text-muted" style="font-size:.85rem">
          Nessun gruppo — <RouterLink to="/groups">creane uno</RouterLink>
        </span>
      </div>
    </div>


    <!-- NOTE -->
    <div class="section-divider">📝 Note libere</div>
    <div class="form-group">
      <label>Note generali</label>
      <textarea v-model="f.notes" placeholder="Osservazioni, cosa provare la prossima volta, promemoria..." rows="4" />
    </div>

    <!-- AZIONI -->
    <div class="form-actions">
      <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Annulla</button>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        <span v-if="saving" class="spinner" style="width:15px;height:15px"></span>
        {{ saving ? 'Salvataggio...' : (isEdit ? 'Aggiorna uscita' : 'Salva uscita') }}
      </button>
    </div>

  </form>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useGroupStore } from '../stores/groups.js'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'

const groupStore = useGroupStore()
const { groups } = storeToRefs(groupStore)
onMounted(() => groupStore.fetchGroups())

const props = defineProps({
  initialData: { type: Object, default: null },
  saving:      { type: Boolean, default: false },
  isEdit:      { type: Boolean, default: false }
})
const emit = defineEmits(['submit', 'cancel'])

const TECHNIQUES = [
  { v:'surfcasting', l:'Surfcasting' }, { v:'feeder', l:'Feeder' },
  { v:'spinning', l:'Spinning' },       { v:'bolentino', l:'Bolentino' },
  { v:'mosca', l:'Mosca' },             { v:'altro', l:'Altro' }
]
const SEA_STATES  = ['piatto', 'poco_mosso', 'mosso', 'molto_mosso', 'agitato']
const TIDE_STATES = ['crescente', 'calante', 'alta', 'bassa']
const WEATHER = [
  { v:'sole', l:'☀️ Sole' }, { v:'nuvoloso', l:'⛅ Nuvoloso' },
  { v:'coperto', l:'☁️ Coperto' }, { v:'pioggia', l:'🌧️ Pioggia' },
  { v:'vento', l:'💨 Vento' }, { v:'nebbia', l:'🌫️ Nebbia' }
]

const emptyBait  = () => ({ name:'', type:'', presentation:'', notes:'' })
const emptyRig   = () => ({ name:'', type:'', hookSize:'', hookType:'', sinkerWeight:null, sinkerType:'', lineMainLb:null, leaderLb:null, swivel:'', notes:'' })
const emptyCast  = () => ({ distance:null, direction:'', rig:'', bait:'', result:'', notes:'' })
const emptyCatch = () => ({ species:'', weightKg:null, lengthCm:null, time:'', distance:null, released:false, baitUsed:'', rigUsed:'', notes:'' })

const defaultForm = () => ({
  title: '', date: new Date().toISOString().split('T')[0],
  startTime: '', endTime: '', technique: '', rating: 0,
  location: { name:'', spot:'', region:'', coords:{ lat:null, lng:null }, notes:'' },
  sea:     { seaState:'', waveHeight:'', wavePeriod:'', current:'', waterColor:'', waterTemp:null, tide:{ state:'', notes:'' } },
  weather: { condition:'', windDirection:'', windSpeed:null, tempAir:null, pressure:null, notes:'' },
  baits: [], rigs: [], casts: [], catches: [], notes: '', visibility: 'private', allowedGroups: []
})

const f = ref(defaultForm())

watch(() => props.initialData, data => {
  if (!data) return
  const d = JSON.parse(JSON.stringify(data))
  const def = defaultForm()
  if (d.date) d.date = d.date.split('T')[0]
  d.location = { ...def.location, ...d.location, coords: { lat: null, lng: null, ...(d.location?.coords || {}) } }
  d.sea      = { ...def.sea, ...d.sea, tide: { state: '', notes: '', ...(d.sea?.tide || {}) } }
  d.weather  = { ...def.weather, ...d.weather }
  f.value = { ...def, ...d }
}, { immediate: true })

function handleSubmit() {
  const payload = JSON.parse(JSON.stringify(f.value))
  if (!payload.location.coords?.lat && !payload.location.coords?.lng) delete payload.location.coords
  emit('submit', payload)
}
</script>

<style scoped>
.session-form { max-width: 920px; }

.sub-block { margin-bottom: .75rem; }
.sub-header { align-items: center; display: flex; justify-content: space-between; margin-bottom: .75rem; }

.star-row { display: flex; gap: .15rem; }
.star-btn {
  background: none; border: none; color: var(--border-light); cursor: pointer;
  font-size: 1.65rem; line-height: 1; padding: .05rem;
  transition: color var(--t), transform var(--t);
}
.star-btn:hover, .star-btn.active { color: var(--sand); }
.star-btn:hover { transform: scale(1.15); }

.form-actions {
  border-top: 1px solid var(--border); display: flex; gap: .75rem;
  justify-content: flex-end; margin-top: 2rem; padding-top: 1.5rem;
}

.group-checkboxes { display: flex; flex-direction: column; gap: .4rem; }
.group-check { align-items: center; color: var(--foam); display: flex; font-size: .88rem; gap: .5rem; letter-spacing: 0; text-transform: none; }
.group-check input { width: auto; }
</style>
