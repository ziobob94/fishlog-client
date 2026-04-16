<template>
  <form @submit.prevent="handleSubmit" class="max-w-[920px]">

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
        <label>Visibilità</label>
        <select v-model="f.visibility">
          <option value="private">🔒 Solo io</option>
          <option value="users">👥 Tutti gli utenti</option>
          <option value="group">🫂 Gruppi specifici</option>
        </select>
      </div>
      <div class="form-group">
        <span>Voto uscita</span>
        <div class="flex gap-1 mt-0.5">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            style="background:transparent; border:none; cursor:pointer; font-size:1.7rem; line-height:1; padding:2px; transition:transform 0.15s;"
            :style="{ color: n <= f.rating ? '#f59e0b' : '#3a5470' }"
            @click="setRating(n)"
            @mouseover="hovered = n"
            @mouseleave="hovered = 0"
          >★</button>
        </div>
      </div>
    </div>

    <div v-if="f.visibility === 'group'" class="form-group mt-3">
      <label>Gruppi autorizzati</label>
      <div class="flex flex-col gap-2 mt-1">
        <label v-for="g in groups" :key="g._id"
          class="flex items-center gap-2 text-foam text-sm normal-case tracking-normal font-normal cursor-pointer"
        >
          <input type="checkbox" :value="g._id" v-model="f.allowedGroups" class="w-auto" />
          {{ g.name }}
        </label>
        <span v-if="!groups.length" class="text-muted text-sm">
          Nessun gruppo — <RouterLink to="/groups">creane uno</RouterLink>
        </span>
      </div>
    </div>

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
        <textarea v-model="f.location.notes" placeholder="Accesso, parcheggio, fondo..." rows="2" />
      </div>
    </div>

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
        <input v-model="f.sea.waterColor" type="text" placeholder="es. torbida, verde" />
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
        <input v-model="f.weather.windDirection" type="text" placeholder="es. Libeccio, NE" />
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

    <div class="section-divider">🪱 Esche</div>
    <BaitsSection v-model="f.baits" />

    <div class="section-divider">🪝 Montature</div>
    <RigsSection v-model="f.rigs" />

    <div class="section-divider">🎯 Lanci e distanze</div>
    <CastsSection v-model="f.casts" />

    <div class="section-divider">🐟 Catture</div>
    <CatchesSection v-model="f.catches" />

    <div class="section-divider">📝 Note libere</div>
    <div class="form-group">
      <label>Note generali</label>
      <textarea v-model="f.notes" placeholder="Osservazioni, cosa provare la prossima volta..." rows="4" />
    </div>

    <div class="flex gap-3 justify-end mt-8 pt-6 border-t border-border">
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
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useGroupStore } from '../stores/groups.js'
import BaitsSection   from './form/BaitsSection.vue'
import RigsSection    from './form/RigsSection.vue'
import CastsSection   from './form/CastsSection.vue'
import CatchesSection from './form/CatchesSection.vue'

const props = defineProps({
  initialData: { type: Object, default: null },
  saving:      { type: Boolean, default: false },
  isEdit:      { type: Boolean, default: false }
})
const emit = defineEmits(['submit', 'cancel'])

const groupStore = useGroupStore()
const { groups } = storeToRefs(groupStore)
onMounted(() => groupStore.fetchGroups())

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

const defaultForm = () => ({
  title: '', date: new Date().toISOString().split('T')[0],
  startTime: '', endTime: '', technique: '', rating: 0,
  visibility: 'private', allowedGroups: [],
  location: { name:'', spot:'', region:'', coords:{ lat:null, lng:null }, notes:'' },
  sea:     { seaState:'', waveHeight:'', wavePeriod:'', current:'', waterColor:'', waterTemp:null, tide:{ state:'', notes:'' } },
  weather: { condition:'', windDirection:'', windSpeed:null, tempAir:null, pressure:null, notes:'' },
  baits: [], rigs: [], casts: [], catches: [], notes: ''
})

const f       = ref(defaultForm())
const hovered = ref(0)

function setRating(n) {
  debugger
  f.value.rating = f.value.rating === n ? 0 : n
}

watch(() => props.initialData, data => {
  if (!data) return
  const d   = JSON.parse(JSON.stringify(data))
  const def = defaultForm()
  if (d.date) d.date = d.date.split('T')[0]
  d.location = { ...def.location, ...d.location, coords: { lat:null, lng:null, ...(d.location?.coords || {}) } }
  d.sea      = { ...def.sea, ...d.sea, tide: { state:'', notes:'', ...(d.sea?.tide || {}) } }
  d.weather  = { ...def.weather, ...d.weather }
  f.value    = { ...def, ...d }
}, { immediate: true })

function handleSubmit() {
  const payload = JSON.parse(JSON.stringify(f.value))
  if (!payload.location.coords?.lat && !payload.location.coords?.lng) delete payload.location.coords
  if (payload.visibility !== 'group') payload.allowedGroups = []
  emit('submit', payload)
}
</script>