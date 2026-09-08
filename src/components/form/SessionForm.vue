<template>
  <form @submit.prevent="handleSubmit" class="session-form">

    <!-- BOTTONE AUTO-FILL (sempre visibile, sopra a tutte le sezioni) -->
    <div class="autofill-bar" v-if="!autofillCollapsed">
      <div>
        <p class="autofill-title">{{ t('sessionForm.autoFill.title') }}</p>
        <p class="autofill-sub">{{ t('sessionForm.autoFill.subtitle') }}</p>
        <p class="autofill-disclaimer">{{ t('sessionForm.autoFill.disclaimer') }}</p>
      </div>
      <button type="button" class="btn btn-secondary btn-sm"
        :disabled="!canAutoFill || autoFilling || gpsLoading" @click="autoFillWeatherAndSea">
        <span v-if="autoFilling || gpsLoading" class="spinner" style="width:13px;height:13px"></span>
        {{ gpsLoading ? t('sessionForm.fields.gpsDetecting') : (autoFilling ? t('sessionForm.autoFill.loading') : t('sessionForm.autoFill.button')) }}
      </button>
    </div>
    <div v-else class="autofill-bar autofill-bar-collapsed">
      <span class="autofill-collapsed-btn" role="button" tabindex="0"
        @click="autofillCollapsed = false" @keydown.enter="autofillCollapsed = false">
        {{ t('sessionForm.autoFill.button') }}
        <FieldInfo :text="t('sessionForm.autoFill.collapsedHint')" />
      </span>
    </div>
    <p v-if="!autofillCollapsed && !canAutoFill" class="autofill-warning">{{ t('sessionForm.autoFill.warning') }}</p>
    <div v-if="!autofillCollapsed && autoFillMsg" class="autofill-result" :class="autoFillMsg.type">{{ autoFillMsg.text }}</div>

    <!-- BASE -->
    <div class="accordion-section">
    <button type="button" class="section-divider accordion-header" :class="{ incomplete: !canLeaveSection('base') }" @click="toggleSection('base')">
      <span>{{ t('sessionForm.sections.base') }}</span>
      <span v-if="!canLeaveSection('base')" class="required-badge" :title="t('sessionForm.requiredToContinue')">*</span>
      <span class="chevron" :class="{ open: isOpen('base') }">▸</span>
    </button>
    <p class="section-desc">{{ t('sessionForm.sections.baseDesc') }}</p>
    <div class="form-grid" v-if="isOpen('base')">
      <div class="form-group full">
        <label>{{ t('sessionForm.fields.titleLabel') }}<FieldInfo :text="t('sessionForm.fields.titleInfo')" /></label>
        <input v-model="f.title" type="text" :placeholder="t('sessionForm.fields.titlePlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.dateLabel') }} <span class="required-mark">*</span><FieldInfo :text="t('sessionForm.fields.dateInfo')" /></label>
        <input v-model="f.date" type="date" required :class="{ 'field-missing': !f.date }" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.startTimeLabel') }}<FieldInfo :text="t('sessionForm.fields.startTimeInfo')" /></label>
        <input v-model="f.startTime" type="time" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.endTimeLabel') }}<FieldInfo :text="t('sessionForm.fields.endTimeInfo')" /></label>
        <input v-model="f.endTime" type="time" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.techniqueLabel') }}<FieldInfo :text="t('sessionForm.fields.techniqueInfo')" /></label>
        <select v-model="f.technique">
          <option value="">{{ t('sessionForm.fields.selectPlaceholder') }}</option>
          <option v-for="t2 in TECHNIQUES" :key="t2.v" :value="t2.v">{{ t2.l }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.waterTypeLabel') }}<FieldInfo :text="t('sessionForm.fields.waterTypeInfo')" /></label>
        <select v-model="f.waterType">
          <option value="">{{ t('sessionForm.fields.selectPlaceholder') }}</option>
          <option v-for="w in WATER_TYPES" :key="w.v" :value="w.v">{{ w.l }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.ratingLabel') }}<FieldInfo :text="t('sessionForm.fields.ratingInfo')" /></label>
        <div class="star-row">
          <button v-for="n in 5" :key="n" type="button"
            class="star-btn" :class="{ active: n <= f.rating }"
            @click="f.rating = f.rating === n ? 0 : n">★</button>
        </div>
      </div>
    </div>
    </div>

    <!-- LUOGO -->
    <div class="accordion-section">
    <button type="button" class="section-divider accordion-header" :class="{ incomplete: !canLeaveSection('location') }" @click="toggleSection('location')">
      <span>{{ t('sessionForm.sections.location') }}</span>
      <span v-if="!canLeaveSection('location')" class="required-badge" :title="t('sessionForm.requiredToContinue')">*</span>
      <span class="chevron" :class="{ open: isOpen('location') }">▸</span>
    </button>
    <p class="section-desc">{{ t('sessionForm.sections.locationDesc') }}</p>
    <template v-if="isOpen('location')">

    <div class="form-grid">
      <div class="form-group">
        <label>{{ t('sessionForm.fields.locationNameLabel') }} <span class="required-mark">*</span><FieldInfo :text="t('sessionForm.fields.locationNameInfo')" /></label>
        <input v-model="f.location.name" type="text" :placeholder="t('sessionForm.fields.locationNamePlaceholder')" required :class="{ 'field-missing': !f.location.name }" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.spotLabel') }}<FieldInfo :text="t('sessionForm.fields.spotInfo')" /></label>
        <input v-model="f.location.spot" type="text" :placeholder="t('sessionForm.fields.spotPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.regionLabel') }}<FieldInfo :text="t('sessionForm.fields.regionInfo')" /></label>
        <input v-model="f.location.region" type="text" :placeholder="t('sessionForm.fields.regionPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.latLabel') }}<FieldInfo :text="t('sessionForm.fields.latInfo')" /></label>
        <input v-model.number="f.location.coords.lat" type="number" step="0.000001" placeholder="43.123456" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.lngLabel') }}<FieldInfo :text="t('sessionForm.fields.lngInfo')" /></label>
        <input v-model.number="f.location.coords.lng" type="number" step="0.000001" placeholder="10.123456" />
      </div>
      <div class="form-group full">
        <label>{{ t('sessionForm.fields.locationNotesLabel') }}<FieldInfo :text="t('sessionForm.fields.locationNotesInfo')" /></label>
        <textarea v-model="f.location.notes" :placeholder="t('sessionForm.fields.locationNotesPlaceholder')" rows="2" />
      </div>
      <div v-if="geocodeMsg" class="form-group full">
        <span class="autofill-hint">{{ geocodeMsg }}</span>
      </div>
      <div class="form-group full">
        <LocationPicker
          :lat="f.location.coords.lat"
          :lng="f.location.coords.lng"
          @update:lat="v => f.location.coords.lat = v"
          @update:lng="v => f.location.coords.lng = v"
        />
      </div>
    </div>
    </template>
    </div>

    <!-- CONDIZIONI ACQUA (adattive) -->
    <div class="accordion-section">
    <button type="button" class="section-divider accordion-header" @click="toggleSection('water')">
      <span>{{ waterSectionTitle }}</span>
      <span class="chevron" :class="{ open: isOpen('water') }">▸</span>
    </button>
    <p class="section-desc">{{ t('sessionForm.sections.waterDesc') }}</p>
    <template v-if="isOpen('water')">
    <div class="form-grid">

      <!-- MARE: stato, onde, marea -->
      <template v-if="isSea">
        <div class="form-group">
          <label>{{ t('sessionForm.fields.seaStateLabel') }}<FieldInfo :text="t('sessionForm.fields.seaStateInfo')" /></label>
          <select v-model="f.sea.seaState">
            <option value="">--</option>
            <option v-for="s in SEA_STATES" :key="s.v" :value="s.v">{{ s.l }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('sessionForm.fields.waveHeightLabel') }}<FieldInfo :text="t('sessionForm.fields.waveHeightInfo')" /></label>
          <input v-model="f.sea.waveHeight" type="text" :placeholder="t('sessionForm.fields.waveHeightPlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('sessionForm.fields.wavePeriodLabel') }}<FieldInfo :text="t('sessionForm.fields.wavePeriodInfo')" /></label>
          <input v-model="f.sea.wavePeriod" type="text" :placeholder="t('sessionForm.fields.wavePeriodPlaceholder')" />
        </div>
      </template>

      <!-- FIUME: livello, corrente select -->
      <template v-else-if="isRiver">
        <div class="form-group">
          <label>{{ t('sessionForm.fields.waterLevelLabel') }}<FieldInfo :text="t('sessionForm.fields.waterLevelInfo')" /></label>
          <select v-model="f.sea.waterLevel">
            <option value="">--</option>
            <option v-for="l in WATER_LEVELS" :key="l.v" :value="l.v">{{ l.l }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('sessionForm.fields.currentLabel') }}<FieldInfo :text="t('sessionForm.fields.currentInfo')" /></label>
          <select v-model="f.sea.current">
            <option value="">--</option>
            <option v-for="c in RIVER_CURRENTS" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </template>

      <!-- MARE/ALTRO: corrente testo -->
      <div v-if="isSea || isOther" class="form-group">
        <label>{{ t('sessionForm.fields.currentLabel') }}<FieldInfo :text="t('sessionForm.fields.currentInfo')" /></label>
        <input v-model="f.sea.current" type="text" :placeholder="t('sessionForm.fields.currentPlaceholder')" />
      </div>

      <!-- COMUNE: colore e temperatura -->
      <div class="form-group">
        <label>{{ t('sessionForm.fields.waterColorLabel') }}<FieldInfo :text="t('sessionForm.fields.waterColorInfo')" /></label>
        <input v-model="f.sea.waterColor" type="text" :placeholder="t('sessionForm.fields.waterColorPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.waterTempLabel') }}<FieldInfo :text="t('sessionForm.fields.waterTempInfo')" /></label>
        <input v-model.number="f.sea.waterTemp" type="number" step="0.5" />
      </div>

      <!-- MARE: marea -->
      <template v-if="isSea">
        <div class="form-group">
          <label>{{ t('sessionForm.fields.tideLabel') }}<FieldInfo :text="t('sessionForm.fields.tideInfo')" /></label>
          <select v-model="f.sea.tide.state">
            <option value="">--</option>
            <option v-for="td in TIDE_STATES" :key="td.v" :value="td.v">{{ td.l }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('sessionForm.fields.tideNotesLabel') }}<FieldInfo :text="t('sessionForm.fields.tideNotesInfo')" /></label>
          <input v-model="f.sea.tide.notes" type="text" :placeholder="t('sessionForm.fields.tideNotesPlaceholder')" />
        </div>
      </template>

    </div>
    </template>
    </div>

    <!-- METEO -->
    <div class="accordion-section">
    <button type="button" class="section-divider accordion-header" @click="toggleSection('weather')">
      <span>{{ t('sessionForm.sections.weather') }}</span>
      <span class="chevron" :class="{ open: isOpen('weather') }">▸</span>
    </button>
    <p class="section-desc">{{ t('sessionForm.sections.weatherDesc') }}</p>
    <template v-if="isOpen('weather')">
    <div class="form-grid">
      <div class="form-group">
        <label>{{ t('sessionForm.fields.conditionLabel') }}<FieldInfo :text="t('sessionForm.fields.conditionInfo')" /></label>
        <select v-model="f.weather.condition">
          <option value="">--</option>
          <option v-for="c in WEATHER" :key="c.v" :value="c.v">{{ c.l }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.windDirectionLabel') }}<FieldInfo :text="t('sessionForm.fields.windDirectionInfo')" /></label>
        <select v-model="f.weather.windDirection">
          <option value="">--</option>
          <option v-for="w in WIND_DIRS" :key="w" :value="w">{{ w }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.windSpeedLabel') }}<FieldInfo :text="t('sessionForm.fields.windSpeedInfo')" /></label>
        <input v-model.number="f.weather.windSpeed" type="number" min="0" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.tempAirLabel') }}<FieldInfo :text="t('sessionForm.fields.tempAirInfo')" /></label>
        <input v-model.number="f.weather.tempAir" type="number" step="0.5" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.pressureLabel') }}<FieldInfo :text="t('sessionForm.fields.pressureInfo')" /></label>
        <input v-model.number="f.weather.pressure" type="number" />
      </div>
      <div class="form-group full">
        <label>{{ t('sessionForm.fields.weatherNotesLabel') }}<FieldInfo :text="t('sessionForm.fields.weatherNotesInfo')" /></label>
        <textarea v-model="f.weather.notes" :placeholder="t('sessionForm.fields.weatherNotesPlaceholder')" rows="2" />
      </div>
    </div>
    </template>
    </div>

    <!-- CATTURE (esca, montatura e lancio sono caratteristiche di ogni cattura) -->
    <div id="section-catches" class="accordion-section">
    <button type="button" class="section-divider accordion-header" @click="toggleSection('catches')">
      <span>{{ t('sessionForm.sections.catches') }}</span>
      <span class="chevron" :class="{ open: isOpen('catches') }">▸</span>
    </button>
    <p class="section-desc">{{ t('sessionForm.sections.catchesDesc') }}</p>
    <template v-if="isOpen('catches')">
    <CatchesSection ref="catchesRef" v-model="f.catches" :location="f.location" class="catches-wrap"/>
    </template>
    </div>

    <!-- NOTE -->
    <div class="accordion-section">
    <button type="button" class="section-divider accordion-header" @click="toggleSection('notes')">
      <span>{{ t('sessionForm.sections.notes') }}</span>
      <span class="chevron" :class="{ open: isOpen('notes') }">▸</span>
    </button>
    <p class="section-desc">{{ t('sessionForm.sections.notesDesc') }}</p>
    <template v-if="isOpen('notes')">
    <div class="form-group">
      <label>{{ t('sessionForm.fields.visibilityLabel') }}<FieldInfo :text="t('sessionForm.fields.visibilityInfo')" /></label>
      <select v-model="f.visibility">
        <option value="private">{{ t('sessionForm.visibility.private') }}</option>
        <option value="users">{{ t('sessionForm.visibility.users') }}</option>
        <option value="group">{{ t('sessionForm.visibility.group') }}</option>
      </select>
    </div>

    <div v-if="f.visibility === 'group'" class="form-group full">
      <label>{{ t('sessionForm.fields.allowedGroupsLabel') }}<FieldInfo :text="t('sessionForm.fields.allowedGroupsInfo')" /></label>
      <div class="group-checkboxes">
        <label v-for="g in groups" :key="g._id" class="group-check">
          <input type="checkbox" :value="g._id" v-model="f.allowedGroups" />
          {{ g.name }}
        </label>
        <span v-if="!groups.length" class="text-muted" style="font-size:.85rem">
          {{ t('sessionForm.fields.noGroups') }} <RouterLink to="/groups">{{ t('sessionForm.fields.createOne') }}</RouterLink>
        </span>
      </div>
    </div>

    <div class="form-group">
      <label>{{ t('sessionForm.fields.generalNotesLabel') }}<FieldInfo :text="t('sessionForm.fields.generalNotesInfo')" /></label>
      <textarea v-model="f.notes" :placeholder="t('sessionForm.fields.generalNotesPlaceholder')" rows="4" />
    </div>
    </template>
    </div>

    <!-- AZIONI -->
    <div class="form-actions">
      <div class="form-actions-inner">
        <button type="button" class="btn btn-ghost" @click="$emit('cancel')">{{ t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          <span v-if="saving" class="spinner" style="width:15px;height:15px"></span>
          {{ saving ? t('sessionForm.saving') : (isEdit ? t('sessionForm.submitEdit') : t('sessionForm.submitCreate')) }}
        </button>
      </div>
    </div>

  </form>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useGroupStore } from '../../stores/groups.js'
  import { useAuthStore } from '../../stores/auth.js'
  import { RouterLink } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import LocationPicker from './LocationPicker.vue'
  import CatchesSection from './CatchesSection.vue'
  import FieldInfo from '../FieldInfo.vue'
  import { useToast } from '../../composables/useToast.js'

  const { t } = useI18n()
  const { toast } = useToast()
  const groupStore = useGroupStore()
  const authStore = useAuthStore()
  const { groups } = storeToRefs(groupStore)
  onMounted(() => groupStore.fetchGroups())

  const props = defineProps({
    initialData: { type: Object, default: null },
    saving: { type: Boolean, default: false },
    isEdit: { type: Boolean, default: false }
  })
  const emit = defineEmits(['submit', 'cancel'])

  // ─── Costanti ─────────────────────────────────────────────────────────────────

  const TECHNIQUES = [
    { v: 'surfcasting', l: 'Surfcasting' }, { v: 'feeder', l: 'Feeder' },
    { v: 'spinning', l: 'Spinning' }, { v: 'bolentino', l: 'Bolentino' },
    { v: 'mosca', l: 'Mosca' }, { v: 'altro', l: 'Altro' }
  ]
  const WATER_TYPES = [
    { v: 'mare', l: '🌊 Mare' },
    { v: 'fiume', l: '🏞️ Fiume' },
    { v: 'lago', l: '🏔️ Lago' },
    { v: 'altro', l: '💧 Altro' },
  ]
  const SEA_STATES = [
    { v: 'piatto', l: '🫧 Piatto' },
    { v: 'poco_mosso', l: '〰️ Poco mosso' },
    { v: 'mosso', l: '🌊 Mosso' },
    { v: 'molto_mosso', l: '🌊💨 Molto mosso' },
    { v: 'agitato', l: '⛈️ Agitato' },
  ]
  const WATER_LEVELS = [
    { v: 'piena', l: '🔼 In piena' },
    { v: 'normale', l: '➡️ Normale' },
    { v: 'magra', l: '🔽 In magra' },
  ]
  const RIVER_CURRENTS = ['🌀 Lenta', '➡️ Moderata', '💨 Sostenuta', '🌊 Forte', '⚡ Molto forte']
  const TIDE_STATES = [
    { v: 'crescente', l: '📈 Crescente' },
    { v: 'calante', l: '📉 Calante' },
    { v: 'alta', l: '⬆️ Alta' },
    { v: 'bassa', l: '⬇️ Bassa' },
  ]
  const WIND_DIRS = [
    'Tramontana (N)', 'Greco-Tramontana (NNE)', 'Grecale (NE)', 'Greco-Levante (ENE)',
    'Levante (E)', 'Scirocco-Levante (ESE)', 'Scirocco (SE)', 'Ostro-Scirocco (SSE)',
    'Ostro (S)', 'Ostro-Libeccio (SSW)', 'Libeccio (SW)', 'Ponente-Libeccio (WSW)',
    'Ponente (W)', 'Maestrale-Ponente (WNW)', 'Maestrale (NW)', 'Tramontana-Maestrale (NNW)',
  ]
  const WEATHER = [
    { v: 'sole', l: '☀️ Sole' }, { v: 'nuvoloso', l: '⛅ Nuvoloso' },
    { v: 'coperto', l: '☁️ Coperto' }, { v: 'pioggia', l: '🌧️ Pioggia' },
    { v: 'vento', l: '💨 Vento' }, { v: 'nebbia', l: '🌫️ Nebbia' }
  ]

  // ─── Tipo d'acqua ─────────────────────────────────────────────────────────────

  const isSea = computed(() => !f.value.waterType || f.value.waterType === 'mare')
  const isRiver = computed(() => f.value.waterType === 'fiume')
  const isOther = computed(() => f.value.waterType === 'altro')

  const waterSectionTitle = computed(() => ({
    mare: t('sessionForm.waterSection.sea'),
    fiume: t('sessionForm.waterSection.river'),
    lago: t('sessionForm.waterSection.lake'),
    altro: t('sessionForm.waterSection.other'),
  }[f.value.waterType] || t('sessionForm.waterSection.sea')))

  // ─── Form data ────────────────────────────────────────────────────────────────

  const defaultForm = () => ({
    title: '', date: new Date().toISOString().split('T')[0],
    startTime: '', endTime: '', technique: '', waterType: '', rating: 0,
    location: { name: '', spot: '', region: '', coords: { lat: null, lng: null }, notes: '' },
    sea: { seaState: '', waveHeight: '', wavePeriod: '', current: '', waterLevel: '', waterColor: '', waterTemp: null, tide: { state: '', notes: '' } },
    weather: { condition: '', windDirection: '', windSpeed: null, tempAir: null, pressure: null, notes: '' },
    catches: [], notes: '', visibility: defaultVisibility(), allowedGroups: []
  })

  function defaultVisibility() {
    const pref = authStore.user?.defaultVisibility
    return ['private', 'users', 'group'].includes(pref) ? pref : 'private'
  }

  const f = ref(defaultForm())

  // ─── Accordion ────────────────────────────────────────────────────────────────

  const ALL_SECTIONS = ['base', 'location', 'water', 'weather', 'catches', 'notes']

  const openSections = ref(new Set(['base', 'catches']))

  function canLeaveSection(id) {
    if (id === 'base') return !!f.value.date
    if (id === 'location') return !!f.value.location.name
    return true
  }

  // Messaggio spiegato per ogni sezione che non si può ancora chiudere,
  // mostrato via toast quando l'utente prova a farlo comunque.
  const SECTION_BLOCKED_MSG = {
    base: () => t('sessionForm.blocked.base'),
    location: () => t('sessionForm.blocked.location')
  }

  function isOpen(id) {
    return openSections.value.has(id)
  }

  function toggleSection(id) {
    const next = new Set(openSections.value)
    if (next.has(id)) {
      if (!canLeaveSection(id)) {
        toast(SECTION_BLOCKED_MSG[id]?.() ?? t('sessionForm.requiredToContinue'), { type: 'warning' })
        return
      }
      next.delete(id)
    } else {
      next.add(id)
    }
    openSections.value = next
  }

  // ─── Auto-fill state ──────────────────────────────────────────────────────────

  const gpsLoading = ref(false)
  const autoFilling = ref(false)
  const geocodeMsg = ref('')
  const autoFillMsg = ref(null)
  const autofillCollapsed = ref(false)
  let geocodeTimer = null

  const canAutoFill = computed(() => !!f.value.date)

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function wmoToCondition(code, windSpeed) {
    if (windSpeed >= 30) return 'vento'
    if (code === 0) return 'sole'
    if (code <= 2) return 'nuvoloso'
    if (code === 3) return 'coperto'
    if (code === 45 || code === 48) return 'nebbia'
    if (code >= 51 && code <= 82) return 'pioggia'
    if (code >= 85 && code <= 86) return 'pioggia'
    if (code >= 95) return 'pioggia'
    return 'nuvoloso'
  }

  function degToWindName(deg) {
    if (deg == null) return ''
    const dirs = [
      'Tramontana (N)', 'Greco-Tramontana (NNE)', 'Grecale (NE)', 'Greco-Levante (ENE)',
      'Levante (E)', 'Scirocco-Levante (ESE)', 'Scirocco (SE)', 'Ostro-Scirocco (SSE)',
      'Ostro (S)', 'Ostro-Libeccio (SSW)', 'Libeccio (SW)', 'Ponente-Libeccio (WSW)',
      'Ponente (W)', 'Maestrale-Ponente (WNW)', 'Maestrale (NW)', 'Tramontana-Maestrale (NNW)',
    ]
    return dirs[Math.round(deg / 22.5) % 16]
  }

  function waveHeightToSeaState(h) {
    if (h == null) return ''
    if (h <= 0.1) return 'piatto'
    if (h <= 0.5) return 'poco_mosso'
    if (h <= 1.25) return 'mosso'
    if (h <= 2.5) return 'molto_mosso'
    return 'agitato'
  }

  // ─── GPS ──────────────────────────────────────────────────────────────────────

  function detectGPS() {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        geocodeMsg.value = t('sessionForm.autoFill.gpsUnsupported')
        resolve(false)
        return
      }
      gpsLoading.value = true
      geocodeMsg.value = ''
      navigator.geolocation.getCurrentPosition(
        pos => {
          f.value.location.coords.lat = parseFloat(pos.coords.latitude.toFixed(6))
          f.value.location.coords.lng = parseFloat(pos.coords.longitude.toFixed(6))
          gpsLoading.value = false
          resolve(true)
        },
        err => {
          gpsLoading.value = false
          geocodeMsg.value = t('sessionForm.autoFill.gpsFailed')
          console.warn('GPS error', err)
          resolve(false)
        },
        { timeout: 10000, enableHighAccuracy: true }
      )
    })
  }

  // ─── Reverse geocoding ────────────────────────────────────────────────────────

  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=it`,
        { headers: { 'Accept-Language': 'it' } }
      )
      const data = await res.json()
      const a = data.address || {}
      return {
        name: a.city || a.town || a.village || a.hamlet || a.county || '',
        region: a.state || a.county || '',
      }
    } catch { return null }
  }

  watch(
    () => [f.value.location.coords.lat, f.value.location.coords.lng],
    ([lat, lng]) => {
      clearTimeout(geocodeTimer)
      if (!lat || !lng) return
      geocodeTimer = setTimeout(async () => {
        geocodeMsg.value = t('sessionForm.autoFill.geocoding')
        const result = await reverseGeocode(lat, lng)
        if (!result) { geocodeMsg.value = ''; return }
        if (!f.value.location.name) f.value.location.name = result.name
        if (!f.value.location.region) f.value.location.region = result.region
        geocodeMsg.value = result.name ? t('sessionForm.autoFill.geocodeFound', { name: result.name }) : ''
      }, 800)
    }
  )

  // ─── Forward geocoding (name → coords) ─────────────────────────────────────────

  async function forwardGeocode(query) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=it`,
        { headers: { 'Accept-Language': 'it' } }
      )
      const data = await res.json()
      if (!data.length) return null
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch { return null }
  }

  let nameGeocodeTimer = null
  watch(
    () => f.value.location.name,
    (name) => {
      clearTimeout(nameGeocodeTimer)
      if (!name || name.trim().length < 3) return
      nameGeocodeTimer = setTimeout(async () => {
        geocodeMsg.value = t('sessionForm.autoFill.geocoding')
        const result = await forwardGeocode(name)
        if (!result) { geocodeMsg.value = ''; return }
        f.value.location.coords.lat = parseFloat(result.lat.toFixed(6))
        f.value.location.coords.lng = parseFloat(result.lng.toFixed(6))
        geocodeMsg.value = ''
      }, 800)
    }
  )

  // ─── Weather + Marine auto-fill ───────────────────────────────────────────────

  async function autoFillWeatherAndSea() {
    const date = f.value.date
    if (!date) return

    if (!f.value.location.coords.lat || !f.value.location.coords.lng) {
      await detectGPS()
    }

    const { lat, lng } = f.value.location.coords
    if (!lat || !lng) return

    autoFilling.value = true
    autoFillMsg.value = null

    const today = new Date().toISOString().split('T')[0]
    const weatherBase = date < today
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast'

    try {
      const isSaltwater = f.value.waterType === 'mare'
      const [weatherRes, marineRes] = await Promise.allSettled([
        fetch(`${weatherBase}?latitude=${lat}&longitude=${lng}&start_date=${date}&end_date=${date}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant&hourly=surface_pressure,relative_humidity_2m&timezone=auto`).then(r => r.json()),
        isSaltwater
          ? fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&start_date=${date}&end_date=${date}&daily=wave_height_max,wave_period_max&timezone=auto`).then(r => r.json())
          : Promise.resolve(null),
      ])

      const filled = []

      if (weatherRes.status === 'fulfilled' && weatherRes.value?.daily) {
        const d = weatherRes.value.daily
        const h = weatherRes.value.hourly
        const code = d.weather_code?.[0]
        const tMax = d.temperature_2m_max?.[0]
        const tMin = d.temperature_2m_min?.[0]
        const windSpeed = d.wind_speed_10m_max?.[0]
        const windDeg = d.wind_direction_10m_dominant?.[0]
        const pressure = h?.surface_pressure?.[12]

        if (code != null) { f.value.weather.condition = wmoToCondition(code, windSpeed); filled.push(t('sessionForm.autoFill.filledFields.condition')) }
        if (tMax != null && tMin != null) { f.value.weather.tempAir = Math.round((tMax + tMin) / 2); filled.push(t('sessionForm.autoFill.filledFields.temperature')) }
        if (windSpeed != null) { f.value.weather.windSpeed = Math.round(windSpeed); filled.push(t('sessionForm.autoFill.filledFields.wind')) }
        if (windDeg != null) { f.value.weather.windDirection = degToWindName(windDeg); filled.push(t('sessionForm.autoFill.filledFields.windDirection')) }
        if (pressure != null) { f.value.weather.pressure = Math.round(pressure); filled.push(t('sessionForm.autoFill.filledFields.pressure')) }
      }

      if (isSaltwater && marineRes.status === 'fulfilled' && marineRes.value?.daily) {
        const m = marineRes.value.daily
        const waveH = m.wave_height_max?.[0]
        const wavePeriod = m.wave_period_max?.[0]
        if (waveH != null) {
          f.value.sea.seaState = waveHeightToSeaState(waveH)
          f.value.sea.waveHeight = `${waveH.toFixed(1)}m`
          filled.push(t('sessionForm.autoFill.filledFields.seaState'), t('sessionForm.autoFill.filledFields.waveHeight'))
        }
        if (wavePeriod != null) {
          f.value.sea.wavePeriod = `${Math.round(wavePeriod)}s`
          filled.push(t('sessionForm.autoFill.filledFields.wavePeriod'))
        }
      }

      autoFillMsg.value = filled.length
        ? { type: 'success', text: t('sessionForm.autoFill.success', { fields: filled.join(', ') }) }
        : { type: 'warn', text: t('sessionForm.autoFill.noData') }

      if (filled.length) autofillCollapsed.value = true

    } catch (err) {
      autoFillMsg.value = { type: 'error', text: t('sessionForm.autoFill.error') }
      console.error('autoFill error', err)
    } finally {
      autoFilling.value = false
    }
  }

  // ─── Form init ────────────────────────────────────────────────────────────────

  watch(() => props.initialData, data => {
    if (!data) return
    const d = JSON.parse(JSON.stringify(data))
    const def = defaultForm()
    if (d.date) d.date = d.date.split('T')[0]
    d.location = { ...def.location, ...d.location, coords: { lat: null, lng: null, ...(d.location?.coords || {}) } }
    d.sea = { ...def.sea, ...d.sea, tide: { state: '', notes: '', ...(d.sea?.tide || {}) } }
    d.weather = { ...def.weather, ...d.weather }
    f.value = { ...def, ...d }
    // Uscite chiuse: qui di default. Uscite "ongoing" ci passano solo su
    // richiesta esplicita ("Modifica altri dati" da OngoingCatchForm). In
    // entrambi i casi tutte le sezioni aperte per la revisione/modifica.
    openSections.value = new Set(ALL_SECTIONS)
  }, { immediate: true })

  const catchesRef = ref(null)

  function handleSubmit() {
    const payload = JSON.parse(JSON.stringify(f.value))
    if (!payload.location.coords?.lat && !payload.location.coords?.lng) delete payload.location.coords
    if (payload.visibility !== 'group') payload.allowedGroups = []
    emit('submit', payload, catchesRef.value?.pendingPhotosByIndex)
  }
</script>

<style scoped>
  .session-form {
    max-width: 920px;
    padding-bottom: 4.5rem;
  }

  .accordion-section+.accordion-section {
    margin-top: .5rem;
  }

  .accordion-header {
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin: 0 -.5rem;
    padding: .6rem .5rem;
    transition: background var(--t);
    width: calc(100% + 1rem);
  }

  .accordion-header:hover {
    background: var(--surface-2, #0d2035);
  }

  .accordion-header.section-divider {
    font-size: .95rem;
    color: var(--foam, #cde);
  }

  .accordion-header.section-divider::before,
  .accordion-header.section-divider::after {
    background: var(--ocean, #0ea5e9);
    opacity: .35;
  }

  .accordion-header + * {
    margin-top: .5rem;
  }

  .section-desc {
    color: var(--text-muted, #6b8fa8);
    font-size: .82rem;
    line-height: 1.4;
    margin: 0 0 1rem;
  }

  .accordion-header::after {
    order: 2;
  }

  .accordion-header.incomplete {
    box-shadow: inset 3px 0 0 var(--danger, #f05050);
  }

  .required-badge {
    color: var(--danger, #f05050);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1;
    order: 3;
    margin-left: .5rem;
  }

  .required-mark {
    color: var(--text-muted, #6b8fa8);
    font-weight: 700;
  }

  .field-missing {
    border-color: var(--danger, #f05050) !important;
  }

  .chevron {
    color: var(--text-muted, #6b8fa8);
    display: inline-block;
    flex-shrink: 0;
    font-size: .7rem;
    order: 3;
    transition: transform var(--t);
  }

  .chevron.open {
    transform: rotate(90deg);
  }

  .star-row {
    display: flex;
    gap: .15rem;
  }

  .star-btn {
    background: none;
    border: none;
    color: var(--border-light);
    cursor: pointer;
    font-size: 1.65rem;
    line-height: 1;
    padding: .05rem;
    transition: color var(--t), transform var(--t);
  }

  .star-btn:hover,
  .star-btn.active {
    color: var(--sand);
  }

  .star-btn:hover {
    transform: scale(1.15);
  }

  .form-actions {
    background: var(--ink);
    border-top: 1px solid var(--border);
    bottom: 0;
    left: 0;
    position: fixed;
    right: 0;
    /* sopra la bottom-nav mobile (z-150 in AppBottomNav.vue), altrimenti
       la copre e il tasto Salva risulta invisibile su schermi piccoli */
    z-index: 160;
  }

  @media (max-width: 767.98px) {
    .form-actions {
      /* si impila sopra la bottom-nav mobile invece di sovrapporvisi */
      bottom: calc(56px + env(safe-area-inset-bottom));
    }

    /* la barra azioni + la bottom-nav sotto restano fisse e coprono il
       fondo dello schermo: senza questo spazio l'ultimo contenuto
       (es. le card di suggerimento specie) resta permanentemente
       nascosto dietro di esse, non basta scrollare. */
    .session-form {
      padding-bottom: calc(56px + env(safe-area-inset-bottom) + 6rem);
    }
  }

  .form-actions-inner {
    display: flex;
    gap: .75rem;
    justify-content: flex-end;
    margin: 0 auto;
    max-width: 1100px;
    padding: 1rem 1.5rem;
  }

  .group-checkboxes {
    display: flex;
    flex-direction: column;
    gap: .4rem;
  }

  .group-check {
    align-items: center;
    color: var(--foam);
    display: flex;
    font-size: .88rem;
    gap: .5rem;
    letter-spacing: 0;
    text-transform: none;
  }

  .group-check input {
    width: auto;
  }

  .autofill-hint {
    color: var(--text-muted, #6b8fa8);
    font-size: .78rem;
    margin-left: .75rem;
  }

  .autofill-bar {
    align-items: center;
    background: var(--surface-2, #0d2035);
    border: 1px solid var(--border, #2a3f55);
    border-radius: 8px;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin: 1.25rem 0 .5rem;
    padding: .85rem 1rem;
  }

  .autofill-title {
    color: var(--foam, #cde);
    font-size: .88rem;
    font-weight: 600;
  }

  .autofill-sub {
    color: var(--text-muted, #6b8fa8);
    font-size: .75rem;
    margin-top: .15rem;
  }

  .autofill-disclaimer {
    color: var(--sand, #f0a040);
    font-size: .72rem;
    font-style: italic;
    margin-top: .3rem;
  }

  .autofill-bar-collapsed {
    padding: .4rem .6rem;
  }

  .autofill-collapsed-btn {
    align-items: center;
    color: var(--text-muted, #6b8fa8);
    cursor: pointer;
    display: flex;
    font-size: .82rem;
    gap: .4rem;
  }

  .autofill-collapsed-btn:hover {
    color: var(--foam, #cde);
  }

  .autofill-warning {
    color: var(--text-muted, #6b8fa8);
    font-size: .78rem;
    margin-bottom: 1rem;
  }

  .autofill-result {
    border-radius: 6px;
    font-size: .82rem;
    margin-bottom: 1rem;
    padding: .5rem .75rem;
  }

  .autofill-result.success {
    background: #0d2f1a;
    border: 1px solid #1a5c30;
    color: #5cd98a;
  }

  .autofill-result.warn {
    background: #2a1f0a;
    border: 1px solid #5c3a00;
    color: #f0a040;
  }

  .autofill-result.error {
    background: #2a0d0d;
    border: 1px solid #5c1a1a;
    color: #f05050;
  }
</style>
