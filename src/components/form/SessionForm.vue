<template>
  <form @submit.prevent="handleSubmit" class="session-form" novalidate>

    <!-- ═══ NUOVA USCITA: solo l'essenziale (luogo, quando, ambiente, tecnica) ═══ -->
    <div v-if="mode === 'essential'" class="essential">
      <button type="button" class="detect-card" :disabled="!canAutoFill || autoFilling || gpsLoading" @click="autoFillWeatherAndSea">
        <span class="detect-icon"><span v-if="autoFilling || gpsLoading" class="m-spinner" style="width:18px;height:18px"></span><RefreshCw v-else-if="hasAutoData" :size="22" /><MapPin v-else :size="22" /></span>
        <span class="detect-text">
          <strong>{{ gpsLoading ? t('sessionForm.fields.gpsDetecting') : (autoFilling ? t('sessionForm.autoFill.loading') : (hasAutoData ? t('sessionForm.autoFill.recalc') : t('sessionForm.essential.detect'))) }}</strong>
          <small>{{ t('sessionForm.essential.detectSub') }}</small>
        </span>
      </button>
      <p v-if="autoFillMsg" class="autofill-result" :class="autoFillMsg.type">{{ autoFillMsg.text }}</p>
      <p v-if="geocodeMsg" class="autofill-hint">{{ geocodeMsg }}</p>

      <section>
        <label class="fl-lab" for="ess-where">{{ t('sessionForm.essential.where') }} <span class="req" :title="t('sessionForm.essential.required')">*</span></label>
        <PlaceInput id="ess-where" v-model="f.location.name" v-model:lat="f.location.coords.lat" v-model:lng="f.location.coords.lng" :invalid="!!essErr.where" required :placeholder="t('sessionForm.fields.locationNamePlaceholder')" @place="applyPlace" />
        <p v-if="essErr.where" id="ess-where-err" class="fl-error" role="alert">{{ t('sessionForm.essential.whereRequired') }}</p>
        <p v-if="f.location.coords.lat && f.location.coords.lng" class="fl-hint fl-mono">{{ f.location.coords.lat }}°N · {{ f.location.coords.lng }}°E · {{ t('sessionForm.essential.detected') }}</p>
      </section>

      <section>
        <span class="fl-lab">{{ t('sessionForm.essential.when') }} <span class="req" :title="t('sessionForm.essential.required')">*</span></span>
        <div class="ess-two">
          <input id="ess-date" v-model="f.date" type="date" v-ph="'gg/mm/aaaa'" class="fl-inp" :class="{ 'fl-err': essErr.date }" :aria-label="t('sessionForm.fields.dateLabel')" />
          <input v-model="f.startTime" type="time" v-ph="'--:--'" class="fl-inp" :aria-label="t('sessionForm.fields.startTimeLabel')" />
        </div>
        <p v-if="essErr.date" class="fl-error" role="alert">{{ t('sessionForm.essential.dateRequired') }}</p>
        <div class="ess-switch">
          <span>{{ t('sessionForm.essential.alreadyDone') }}</span>
          <button type="button" class="fl-switch" :class="{ on: concluded }" role="switch" :aria-checked="concluded" :aria-label="t('sessionForm.essential.alreadyDone')" @click="concluded = !concluded"></button>
        </div>
        <div v-if="concluded" class="ess-end">
          <label class="fl-lab" for="ess-end">{{ t('sessionForm.fields.endTimeLabel') }}</label>
          <input id="ess-end" v-model="f.endTime" type="time" v-ph="'--:--'" class="fl-inp" />
        </div>
      </section>

      <section>
        <span class="fl-lab">{{ t('sessionForm.essential.water') }}</span>
        <div class="ess-chips">
          <button v-for="w in WATER_TYPES" :key="w.v" type="button" class="fl-chip" :class="{ on: f.waterType === w.v }" :aria-pressed="f.waterType === w.v" @click="f.waterType = f.waterType === w.v ? '' : w.v">{{ w.l }}</button>
        </div>
      </section>

      <section>
        <span class="fl-lab">{{ t('sessionForm.fields.techniqueLabel') }}</span>
        <div class="ess-chips">
          <button v-for="t2 in TECHNIQUES" :key="t2.v" type="button" class="fl-chip" :class="{ on: f.technique === t2.v }" :aria-pressed="f.technique === t2.v" @click="f.technique = f.technique === t2.v ? '' : t2.v">{{ t2.l }}</button>
        </div>
      </section>
      <p class="ess-foot">{{ t('sessionForm.essential.later') }}</p>
    </div>

    <!-- ═══ DATI USCITA: elenco di righe → una schermata per sezione ═══ -->
    <div v-else-if="menuMode && !activeSection" class="data-menu">
      <button type="button" class="detect-card" :disabled="!canAutoFill || autoFilling || gpsLoading" @click="autoFillWeatherAndSea">
        <span class="detect-icon"><span v-if="autoFilling || gpsLoading" class="m-spinner" style="width:18px;height:18px"></span><RefreshCw v-else-if="hasAutoData" :size="22" /><MapPin v-else :size="22" /></span>
        <span class="detect-text">
          <strong>{{ gpsLoading ? t('sessionForm.fields.gpsDetecting') : (autoFilling ? t('sessionForm.autoFill.loading') : (hasAutoData ? t('sessionForm.autoFill.recalc') : t('sessionForm.menu.autofill'))) }}</strong>
          <small>{{ t('sessionForm.menu.autofillSub') }}</small>
        </span>
        <ChevronRight :size="20" class="menu-go" />
      </button>
      <p v-if="autoFillMsg" class="autofill-result" :class="autoFillMsg.type">{{ autoFillMsg.text }}</p>
      <section v-for="g in menuGroups" :key="g.id" class="menu-group" :aria-labelledby="`mg-${g.id}`">
        <h3 :id="`mg-${g.id}`" class="menu-group-title">{{ g.title }}</h3>
        <button v-for="row in g.rows" :key="row.id" type="button" class="menu-row" @click="openRow(row.id)">
          <span class="menu-icon" :class="{ done: row.done }"><component :is="MENU_ICONS[row.id]" :size="22" /></span>
          <span class="menu-text"><strong>{{ row.title }}</strong><small>{{ row.sub }}</small></span>
          <span class="menu-status fl-mono" :class="{ done: row.done }">{{ row.status }}</span>
          <ChevronRight :size="18" class="menu-go" />
        </button>
      </section>
      <button type="button" class="delete-link" @click="$emit('delete')"><Trash2 :size="18" /> {{ t('sessionForm.menu.delete') }}</button>
    </div>

    <div v-else-if="menuMode" class="section-bar">
      <button type="button" class="link-back" @click="activeSection = null"><ArrowLeft :size="18" /> {{ t('sessionForm.menu.back') }}</button>
      <h3>{{ sectionLabel(activeSection) }}</h3>
    </div>

    <div v-show="mode !== 'essential' && (!menuMode || activeSection)" :class="{ 'single-section': menuMode }">
    <!-- BOTTONE AUTO-FILL (sempre visibile, sopra a tutte le sezioni) -->
    <div class="autofill-bar" v-if="showAutofill">
      <div>
        <p class="autofill-title">{{ t('sessionForm.autoFill.title') }}</p>
        <p class="autofill-sub">{{ t('sessionForm.autoFill.subtitle') }}</p>
        <p class="autofill-disclaimer">{{ t('sessionForm.autoFill.disclaimer') }}</p>
      </div>
      <button type="button" class="btn btn-secondary btn-sm"
        :disabled="!canAutoFill || autoFilling || gpsLoading" @click="autoFillWeatherAndSea">
        <span v-if="autoFilling || gpsLoading" class="m-spinner" style="width:13px;height:13px"></span>
        <RefreshCw v-else-if="hasAutoData" :size="14" />
        {{ gpsLoading ? t('sessionForm.fields.gpsDetecting') : (autoFilling ? t('sessionForm.autoFill.loading') : (hasAutoData ? t('sessionForm.autoFill.recalc') : t('sessionForm.autoFill.button'))) }}
      </button>
    </div>
    <p v-if="!canAutoFill" class="autofill-warning">{{ t('sessionForm.autoFill.warning') }}</p>
    <div v-if="autoFillMsg" class="autofill-result" :class="autoFillMsg.type" role="status">{{ autoFillMsg.text }}</div>

    <div class="expand-all-row">
      <button type="button" class="btn btn-ghost btn-sm" @click="toggleAll">
        {{ allOpen ? t('sessionForm.collapseAll') : t('sessionForm.expandAll') }}
      </button>
    </div>

    <!-- BASE -->
    <div class="accordion-section" v-show="sectionVisible('base')">
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
        <input v-model="f.date" type="date" v-ph="'gg/mm/aaaa'" required :class="{ 'field-missing': !f.date }" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.startTimeLabel') }}<FieldInfo :text="t('sessionForm.fields.startTimeInfo')" /></label>
        <input v-model="f.startTime" type="time" v-ph="'--:--'" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.endTimeLabel') }}<FieldInfo :text="t('sessionForm.fields.endTimeInfo')" /></label>
        <input v-model="f.endTime" type="time" v-ph="'--:--'" />
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
    </div>
    </div>

    <!-- VOTO (nel menu: pagina a sé; nel form lungo resta in fondo a «Dati uscita») -->
    <div class="accordion-section" v-show="sectionVisible('rating')">
    <div class="form-grid">
      <div class="form-group full">
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
    <div class="accordion-section" v-show="sectionVisible('location')">
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
        <PlaceInput id="loc-name" v-model="f.location.name" v-model:lat="f.location.coords.lat" v-model:lng="f.location.coords.lng" required :placeholder="t('sessionForm.fields.locationNamePlaceholder')" @place="applyPlace" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.spotLabel') }}<FieldInfo :text="t('sessionForm.fields.spotInfo')" /></label>
        <input v-model="f.location.spot" type="text" :placeholder="t('sessionForm.fields.spotPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.regionLabel') }}<FieldInfo :text="t('sessionForm.fields.regionInfo')" /></label>
        <input :value="f.location.region" type="text" readonly class="derived" :placeholder="t('sessionForm.fields.regionPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.latLabel') }}<FieldInfo :text="t('sessionForm.fields.latInfo')" /></label>
        <input :value="f.location.coords.lat ?? ''" type="text" readonly class="derived" placeholder="43.123456" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.lngLabel') }}<FieldInfo :text="t('sessionForm.fields.lngInfo')" /></label>
        <input :value="f.location.coords.lng ?? ''" type="text" readonly class="derived" placeholder="10.123456" />
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
          @place="p => applyPlace(p, true)"
        />
      </div>
    </div>
    </template>
    </div>

    <!-- CONDIZIONI ACQUA (adattive) -->
    <div class="accordion-section" v-show="sectionVisible('water')">
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
        <input v-model.number="f.sea.waterTemp" type="number" step="0.5" placeholder="°C" />
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
    <div class="accordion-section" v-show="sectionVisible('weather')">
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
        <input v-model.number="f.weather.windSpeed" type="number" min="0" placeholder="km/h" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.tempAirLabel') }}<FieldInfo :text="t('sessionForm.fields.tempAirInfo')" /></label>
        <input v-model.number="f.weather.tempAir" type="number" step="0.5" placeholder="°C" />
      </div>
      <div class="form-group">
        <label>{{ t('sessionForm.fields.pressureLabel') }}<FieldInfo :text="t('sessionForm.fields.pressureInfo')" /></label>
        <input v-model.number="f.weather.pressure" type="number" placeholder="hPa" />
      </div>
      <div class="form-group full">
        <label>{{ t('sessionForm.fields.weatherNotesLabel') }}<FieldInfo :text="t('sessionForm.fields.weatherNotesInfo')" /></label>
        <textarea v-model="f.weather.notes" :placeholder="t('sessionForm.fields.weatherNotesPlaceholder')" rows="2" />
      </div>
    </div>
    </template>
    </div>

    <!-- CATTURE (esca, montatura e lancio sono caratteristiche di ogni cattura) -->
    <div id="section-catches" class="accordion-section" v-show="sectionVisible('catches')">
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
    <div class="accordion-section" v-show="sectionVisible('notes')">
    <button type="button" class="section-divider accordion-header" @click="toggleSection('notes')">
      <span>{{ t('sessionForm.sections.notes') }}</span>
      <span class="chevron" :class="{ open: isOpen('notes') }">▸</span>
    </button>
    <p class="section-desc">{{ t('sessionForm.sections.notesDesc') }}</p>
    <template v-if="isOpen('notes')">
    <template v-if="!menuMode">
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
    </template>

    <div class="form-group">
      <label>{{ t('sessionForm.fields.generalNotesLabel') }}<FieldInfo :text="t('sessionForm.fields.generalNotesInfo')" /></label>
      <textarea v-model="f.notes" :placeholder="t('sessionForm.fields.generalNotesPlaceholder')" rows="4" />
    </div>
    </template>
    </div>

    </div>

    <!-- Foglio dal basso: visibilità -->
    <BottomSheet v-model="visSheet" :label="t('sessionMenu.sheetTitle')">
      <div class="vis-sheet">
        <h2 class="vis-title">{{ t('sessionMenu.sheetTitle') }}</h2>
        <div class="vis-opts" role="radiogroup" :aria-label="t('sessionMenu.visibility')">
          <button v-for="v in ['private', 'users', 'group']" :key="v" type="button" class="vis-opt" :class="{ on: f.visibility === v }" role="radio" :aria-checked="f.visibility === v" @click="f.visibility = v">
            <strong>{{ t(`sessionForm.visibility.${v}`) }}</strong>
            <small>{{ t(`session.ongoing.${({ private: 'visPrivateHint', users: 'visUsersHint', group: 'visGroupHint' })[v]}`) }}</small>
          </button>
        </div>
        <div v-if="f.visibility === 'group'" class="group-checkboxes">
          <label v-for="g in groups" :key="g._id" class="group-check"><input type="checkbox" :value="g._id" v-model="f.allowedGroups" /> {{ g.name }}</label>
          <span v-if="!groups.length" class="text-muted" style="font-size:.85rem">{{ t('sessionForm.fields.noGroups') }}</span>
        </div>
        <button type="button" class="fl-btn1" @click="visSheet = false">{{ t('sessionMenu.done') }}</button>
      </div>
    </BottomSheet>

    <!-- AZIONI -->
    <div class="form-actions">
      <div v-if="mode !== 'essential' && (!online || error)" class="form-status" role="alert" :class="{ off: !online }">
        <template v-if="!online"><WifiOff :size="16" /> {{ t('sessionMenu.offline') }}</template>
        <template v-else><AlertTriangle :size="16" /> {{ t('sessionMenu.saveError') }}
          <button type="button" class="status-retry" :disabled="saving" @click="handleSubmit">{{ t('sessionMenu.retry') }}</button></template>
      </div>
      <div class="form-actions-inner" :class="{ 'ess-actions': mode === 'essential' }">
        <template v-if="menuMode && activeSection">
          <button type="button" class="btn btn-primary" @click="activeSection = null">{{ t('sessionForm.menu.done') }}</button>
        </template>
        <template v-else>
          <button v-if="mode !== 'essential'" type="button" class="btn btn-ghost" @click="$emit('cancel')">{{ t('common.cancel') }}</button>
          <button type="submit" :class="mode === 'essential' ? 'fl-btn1' : 'btn btn-primary'" :disabled="saving || !online">
            <span v-if="saving" class="m-spinner" style="width:15px;height:15px"></span>
            {{ saving ? t('sessionForm.saving') : (mode === 'essential' ? (concluded ? t('sessionForm.essential.save') : t('sessionForm.essential.start')) : (isEdit ? t('sessionForm.submitEdit') : t('sessionForm.submitCreate'))) }}
          </button>
        </template>
      </div>
    </div>

  </form>
</template>

<script setup>
  import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
  import { ChevronRight, ArrowLeft, MapPin, RefreshCw, Trash2, FileText, Waves, Star, Eye, StickyNote, WifiOff, AlertTriangle } from 'lucide-vue-next'
  const MENU_ICONS = { general: FileText, location: MapPin, rating: Star, waterweather: Waves, visibility: Eye, notes: StickyNote }
  import { useI18n } from 'vue-i18n'
  import { useGroupStore } from '../../stores/groups.js'
  import { useAuthStore } from '../../stores/auth.js'
  import { RouterLink, onBeforeRouteLeave } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import LocationPicker from './LocationPicker.vue'
  import PlaceInput from './PlaceInput.vue'
  import api from '../../utils/api.js'
  import { reverseGeocode, geocodeText } from '../../utils/places.js'
  import CatchesSection from './CatchesSection.vue'
  import FieldInfo from '../FieldInfo.vue'
  import BottomSheet from '../motion/BottomSheet.vue'
  import { useOnline } from '../../composables/useOnline.js'
  import { useUnsavedGuard } from '../../composables/useUnsavedGuard.js'
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
    error: { type: String, default: '' },
    isEdit: { type: Boolean, default: false },
    // 'essential' = nuova uscita (solo luogo/quando/ambiente/tecnica); 'full' = modifica a sezioni
    mode: { type: String, default: 'full' }
  })
  const emit = defineEmits(['submit', 'cancel', 'delete'])

  // ─── Nuova uscita essenziale e menu «Dati uscita» ─────────────────────────────

  const concluded = ref(false)
  // Nuova uscita: l'ora di inizio parte da adesso (modificabile)
  onMounted(() => {
    if (props.mode === 'essential' && !f.value.startTime) {
      const d = new Date()
      f.value.startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  })
  const activeSection = ref(null)
  const menuMode = computed(() => props.isEdit && props.mode !== 'essential')

  // Sezioni del menu «Dati uscita» → sezioni dell'accordion mostrate nella pagina
  const SECTION_MAP = { general: ['base'], location: ['location'], rating: ['rating'], waterweather: ['water', 'weather'], notes: ['notes'] }
  const online = useOnline()
  const visSheet = ref(false)

  function openSection(id) {
    activeSection.value = id
    openSections.value = new Set(ALL_SECTIONS)
    nextTick(() => window.scrollTo({ top: 0 }))
  }
  // Visibilità = foglio dal basso, tutte le altre voci = pagina a sé
  function openRow(id) { id === 'visibility' ? (visSheet.value = true) : openSection(id) }
  const sectionVisible = id => !menuMode.value || (SECTION_MAP[activeSection.value] || []).includes(id)
  function sectionLabel(id) {
    return { general: t('sessionMenu.general'), rating: t('sessionMenu.rating'), waterweather: t('sessionMenu.waterWeather'), notes: t('sessionMenu.notes') }[id] || t(`sessionForm.sections.${id}`)
  }
  const menuGroups = computed(() => {
    const done = t('sessionForm.menu.filled'), todo = t('sessionForm.menu.toAdd')
    const hasObj = o => Object.values(o || {}).some(v => v && typeof v === 'object' ? hasObj(v) : (v !== '' && v !== null && v !== undefined && v !== 0))
    const row = (id, title, sub, ok, status) => ({ id, title, sub, done: ok, status: status || (ok ? done : todo) })
    return [
      { id: 'main', title: t('sessionMenu.main'), rows: [
        row('general', t('sessionMenu.general'), t('sessionMenu.generalSub'), !!f.value.date),
        row('location', t('sessionForm.sections.location'), t('sessionForm.menu.sub.location'), !!f.value.location.name),
        row('rating', t('sessionMenu.rating'), t('sessionMenu.ratingSub'), f.value.rating > 0, f.value.rating > 0 ? `${f.value.rating}/5` : t('sessionMenu.ratingNone'))
      ] },
      { id: 'other', title: t('sessionMenu.other'), rows: [
        row('waterweather', t('sessionMenu.waterWeather'), t('sessionMenu.waterWeatherSub'), hasObj(f.value.sea) || hasObj(f.value.weather)),
        row('visibility', t('sessionMenu.visibility'), t('sessionMenu.sheetTitle'), true, t(`sessionForm.visibility.${f.value.visibility || 'private'}`)),
        row('notes', t('sessionMenu.notes'), t('sessionMenu.notesSub'), !!f.value.notes, f.value.notes ? done : t('sessionMenu.notesEmpty'))
      ] }
    ]
  })

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
    location: { name: '', spot: '', region: '', municipality: '', province: '', country: '', coords: { lat: null, lng: null }, notes: '' },
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

  const allOpen = computed(() => ALL_SECTIONS.every(id => openSections.value.has(id)))

  // Apre tutto, oppure richiude solo le sezioni non obbligatorie compilate.
  function toggleAll() {
    openSections.value = allOpen.value
      ? new Set(ALL_SECTIONS.filter(id => !canLeaveSection(id) || id === 'catches'))
      : new Set(ALL_SECTIONS)
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
  const autofillDone = ref(false)
  // già compilato (in questa sessione di modifica o salvato in precedenza): l'azione diventa «Ricalcola»
  const hasAutoData = computed(() => autofillDone.value || f.value.weather?.windSpeed != null || f.value.weather?.tempAir != null || !!f.value.weather?.condition)
  let geocodeTimer = null

  const canAutoFill = computed(() => !!f.value.date)
  const showAutofill = computed(() => !menuMode.value || ['location', 'waterweather'].includes(activeSection.value))

  // ─── Helpers ──────────────────────────────────────────────────────────────────

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
          forceNameNext = true; appliedKey = ''
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

  // ─── Luogo (Google, vedi utils/places.js) ─────────────────────────────────────
  // Nome, regione e coordinate si calcolano sempre insieme dallo stesso luogo, così non
  // possono contraddirsi. Regione e coordinate nel form non si digitano: arrivano dal luogo.

  let skipNameGeocode = false
  let appliedKey = ''
  let forceNameNext = false

  function applyPlace(p, overwriteName = false) {
    if (!p) return
    skipNameGeocode = true
    appliedKey = `${p.lat},${p.lng}`
    if (overwriteName && p.name) f.value.location.name = p.name
    f.value.location.region = p.region || p.province || p.country || ''
    // Zone per le classifiche locali, sempre allineate al luogo scelto.
    f.value.location.municipality = p.municipality || p.city || ''
    f.value.location.province = p.province || ''
    f.value.location.country = p.country || ''
    if (p.lat != null && p.lng != null) {
      f.value.location.coords.lat = parseFloat(Number(p.lat).toFixed(6))
      f.value.location.coords.lng = parseFloat(Number(p.lng).toFixed(6))
    }
    geocodeMsg.value = ''
  }

  watch(
    () => [f.value.location.coords.lat, f.value.location.coords.lng],
    ([lat, lng]) => {
      clearTimeout(geocodeTimer)
      if (!lat || !lng) return
      if (appliedKey === `${lat},${lng}`) return   // già calcolati dal luogo scelto
      geocodeTimer = setTimeout(async () => {
        geocodeMsg.value = t('sessionForm.autoFill.geocoding')
        const result = await reverseGeocode(lat, lng)
        if (!result) { geocodeMsg.value = ''; return }
        appliedKey = `${lat},${lng}`
        skipNameGeocode = true
        if (!f.value.location.name || forceNameNext) f.value.location.name = result.name
        forceNameNext = false
        f.value.location.region = result.region || result.province || result.country || ''
        f.value.location.municipality = result.municipality || result.city || ''
        f.value.location.province = result.province || ''
        f.value.location.country = result.country || ''
        geocodeMsg.value = result.name ? t('sessionForm.autoFill.geocodeFound', { name: result.name }) : ''
      }, 400)
    }
  )

  // Nome scritto a mano senza scegliere un suggerimento: coordinate e regione dal Geocoding.
  let nameGeocodeTimer = null
  let nameGeocodePending = false
  async function geocodeName(name) {
    const r = await geocodeText(name)
    if (!r) return
    applyPlace(r)
  }
  watch(
    () => f.value.location.name,
    (name) => {
      clearTimeout(nameGeocodeTimer)
      if (skipNameGeocode) { skipNameGeocode = false; return }
      if (!name || name.trim().length < 3) return
      nameGeocodePending = true
      nameGeocodeTimer = setTimeout(async () => {
        nameGeocodePending = false
        geocodeMsg.value = t('sessionForm.autoFill.geocoding')
        await geocodeName(name)
        geocodeMsg.value = ''
      }, 900)
    }
  )

  // ─── Weather + Marine auto-fill ───────────────────────────────────────────────

  // Se il luogo è stato appena cambiato, le coordinate vanno aggiornate prima di ricalcolare.
  async function flushNameGeocode() {
    if (!nameGeocodePending) return
    clearTimeout(nameGeocodeTimer)
    nameGeocodePending = false
    const name = f.value.location.name
    if (!name || name.trim().length < 3) return
    geocodeMsg.value = t('sessionForm.autoFill.geocoding')
    await geocodeName(name)
    geocodeMsg.value = ''
  }

  // Compila (o ricalcola) meteo e condizioni acqua con i valori correnti di luogo, data e ora.
  async function autoFillWeatherAndSea() {
    const date = f.value.date
    autoFillMsg.value = null
    if (!date) { autoFillMsg.value = { type: 'error', text: t('sessionForm.autoFill.warning') }; return }

    await flushNameGeocode()
    if (!f.value.location.coords.lat || !f.value.location.coords.lng) {
      await detectGPS()
    }

    const { lat, lng } = f.value.location.coords
    if (!lat || !lng) { autoFillMsg.value = { type: 'error', text: t('sessionForm.autoFill.noPlace') }; return }

    autoFilling.value = true

    try {
      const isSaltwater = f.value.waterType === 'mare'
      const hour = Math.min(23, Math.max(0, parseInt(String(f.value.startTime || '12').split(':')[0], 10) || 12))
      // Meteo da Google (server), mare e ripiego da Open-Meteo: /api/weather/day
      const { data: w } = await api.get('/weather/day', { params: { lat, lng, date, hour, marine: isSaltwater ? 1 : 0 } })

      const filled = []

      if (w.condition != null) { f.value.weather.condition = w.condition; filled.push(t('sessionForm.autoFill.filledFields.condition')) }
      if (w.tempAir != null) { f.value.weather.tempAir = w.tempAir; filled.push(t('sessionForm.autoFill.filledFields.temperature')) }
      if (w.windSpeed != null) { f.value.weather.windSpeed = Math.round(w.windSpeed); filled.push(t('sessionForm.autoFill.filledFields.wind')) }
      if (w.windDeg != null) { f.value.weather.windDirection = degToWindName(w.windDeg); filled.push(t('sessionForm.autoFill.filledFields.windDirection')) }
      if (w.pressure != null) { f.value.weather.pressure = Math.round(w.pressure); filled.push(t('sessionForm.autoFill.filledFields.pressure')) }

      if (isSaltwater && w.waveHeight != null) {
        f.value.sea.seaState = waveHeightToSeaState(w.waveHeight)
        f.value.sea.waveHeight = `${w.waveHeight.toFixed(1)}m`
        filled.push(t('sessionForm.autoFill.filledFields.seaState'), t('sessionForm.autoFill.filledFields.waveHeight'))
      }
      if (isSaltwater && w.wavePeriod != null) {
        f.value.sea.wavePeriod = `${Math.round(w.wavePeriod)}s`
        filled.push(t('sessionForm.autoFill.filledFields.wavePeriod'))
      }

      autoFillMsg.value = filled.length
        ? { type: 'success', text: t('sessionForm.autoFill.success', { fields: filled.join(', ') }) }
        : { type: 'warn', text: t('sessionForm.autoFill.noData') }

      if (filled.length) autofillDone.value = true

    } catch (err) {
      autoFillMsg.value = { type: 'error', text: navigator.onLine === false ? t('sessionForm.autoFill.offline') : t('sessionForm.autoFill.error') }
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
    // Dati appena caricati: non devono far partire geocoding/ricalcoli automatici
    // (cambierebbero il form e farebbero comparire «Uscire senza salvare?» senza modifiche).
    const { lat, lng } = f.value.location.coords
    if (lat && lng) appliedKey = `${lat},${lng}`
    if (f.value.location.name) skipNameGeocode = true
  }, { immediate: true })

  const catchesRef = ref(null)
  const essErr = ref({ where: false, date: false })
  watch(() => f.value.location.name, v => { if (v?.trim()) essErr.value.where = false })
  watch(() => f.value.date, v => { if (v) essErr.value.date = false })

  // «Uscire senza salvare?»: confronto con lo stato di partenza (si ferma al primo submit)
  const formSnap = () => JSON.stringify(f.value)
  const baseSnap = ref('')
  // Dentro una sezione, «indietro» (freccia o gesto) torna al menu dell'uscita invece di uscire dalla pagina
  onBeforeRouteLeave(() => {
    if (menuMode.value && activeSection.value) { activeSection.value = null; return false }
    return true
  })
  useUnsavedGuard(() => baseSnap.value !== '' && formSnap() !== baseSnap.value)
  onMounted(() => nextTick(() => { baseSnap.value = formSnap() }))
  // Se il salvataggio fallisce i dati restano e l'uscita torna a chiedere conferma
  watch(() => props.error, e => { if (e) { baseSnap.value = JSON.stringify(defaultForm()) + '#' } })

  function handleSubmit() {
    // Campo obbligatorio vuoto: apre la sezione e porta lì l'utente, con
    // messaggio chiaro (altrimenti il browser non può evidenziare un campo
    // nascosto in una sezione chiusa e l'invio sembra non fare nulla).
    if (props.mode === 'essential') {
      essErr.value = { where: !f.value.location.name?.trim(), date: !f.value.date }
      if (essErr.value.where || essErr.value.date) {
        nextTick(() => document.getElementById(essErr.value.where ? 'ess-where' : 'ess-date')?.focus())
        return
      }
    }
    for (const id of ['base', 'location']) {
      if (!canLeaveSection(id)) {
        const next = new Set(openSections.value); next.add(id); openSections.value = next
        if (menuMode.value) activeSection.value = id
        toast(SECTION_BLOCKED_MSG[id](), { type: 'warning' })
        nextTick(() => document.querySelector('.field-missing')?.focus())
        return
      }
    }
    const payload = JSON.parse(JSON.stringify(f.value))
    if (!payload.location.coords?.lat && !payload.location.coords?.lng) delete payload.location.coords
    if (payload.visibility !== 'group') payload.allowedGroups = []
    baseSnap.value = formSnap()
    emit('submit', payload, catchesRef.value?.pendingPhotosByIndex, { concluded: props.mode === 'essential' && concluded.value })
  }
</script>

<style scoped>
  .expand-all-row { display: flex; justify-content: flex-end; margin: .25rem 0 .5rem; }
  .session-form {
    max-width: 920px;
    padding-bottom: 4.5rem;
  }

  .session-form { counter-reset: sec; }

  /* Ogni sezione è una card numerata («carta nautica») */
  .accordion-section {
    counter-increment: sec;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: .25rem .875rem .75rem;
  }

  .accordion-section+.accordion-section {
    margin-top: .75rem;
  }

  .accordion-header {
    background: none;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    margin: 0;
    min-height: 44px;
    padding: .5rem 0;
    transition: background var(--t);
    width: 100%;
    justify-content: flex-start;
    text-align: left;
  }

  .accordion-header:hover {
    background: transparent;
  }

  .accordion-header.section-divider {
    font-size: 1rem;
    letter-spacing: 0;
    text-transform: none;
    color: var(--foam);
  }

  .accordion-header.section-divider::before {
    content: counter(sec);
    flex: none;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--surface-2);
    color: var(--foam);
    font-size: .8rem;
  }

  .accordion-header.section-divider::after {
    display: none;
  }

  .accordion-header .chevron { margin-left: auto; }

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
    box-shadow: none;
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
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    position: fixed;
    right: 0;
    z-index: 160;
  }

  @media (max-width: 767.98px) {
    /* la barra azioni resta fissa e copre il fondo dello schermo: senza
       questo spazio l'ultimo contenuto (es. le card di suggerimento
       specie) resta permanentemente nascosto dietro di essa, non basta
       scrollare. */
    .session-form {
      padding-bottom: calc(env(safe-area-inset-bottom) + 7.5rem);
    }
  }

  .menu-group { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
  .menu-group-title { font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); margin: 0 2px; }
  .menu-status.fl-mono { font-size: 13px; }
  .menu-row:focus-visible, .vis-opt:focus-visible, .status-retry:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
  .vis-sheet { display: flex; flex-direction: column; gap: 14px; }
  .vis-title { font-size: 22px; font-weight: 800; margin: 6px 0 0; color: var(--foam); }
  .vis-opts { display: flex; flex-direction: column; gap: 8px; }
  .vis-opt { display: flex; flex-direction: column; gap: 2px; text-align: left; min-height: 64px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; color: var(--foam); cursor: pointer; }
  .vis-opt small { color: var(--text-muted); font-size: 13px; }
  .vis-opt.on { border-color: rgb(var(--color-ocean-text)); background: rgba(14, 165, 233, .1); }
  .form-status { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem; padding: 10px 16px; font-size: 14px; font-weight: 600; color: rgb(var(--color-danger-text)); }
  .form-status.off { color: var(--foam); }
  .status-retry { margin-left: auto; min-height: 44px; padding: 0 14px; background: none; border: 1px solid currentColor; border-radius: 10px; color: inherit; font-weight: 700; cursor: pointer; }
  .form-actions-inner {
    display: flex;
    gap: .75rem;
    justify-content: flex-end;
    margin: 0 auto;
    max-width: 1100px;
    padding: .75rem 1rem;
  }

  @media (max-width: 767.98px) {
    /* su telefono i due pulsanti riempiono la barra, a metà ciascuno */
    .form-actions-inner > .btn { flex: 1 1 0; min-width: 0; justify-content: center; }
    .form-actions-inner > .btn-primary { flex: 1.6 1 0; }
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

  .derived { opacity: .75; cursor: default; }
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

  /* ── Nuova uscita essenziale (mockup 12) ── */
  .essential { display: flex; flex-direction: column; gap: 22px; padding-bottom: calc(110px + env(safe-area-inset-bottom)); }
  .detect-card { align-items: center; background: rgb(var(--color-sea-deep)); border: 1px solid var(--border); border-radius: 24px 24px 24px 8px; color: var(--foam); cursor: pointer; display: flex; gap: 14px; min-height: 72px; padding: 14px 16px; text-align: left; width: 100%; box-sizing: border-box; }
  .detect-card:disabled { opacity: .6; }
  .detect-icon { width: 44px; height: 44px; border-radius: 14px; background: rgba(14, 165, 233, .16); color: rgb(var(--color-ocean-text)); display: flex; align-items: center; justify-content: center; flex: none; }
  .detect-text { display: flex; flex: 1; flex-direction: column; gap: 2px; }
  .detect-text strong { font-size: 16px; font-weight: 700; }
  .detect-text small { color: var(--text-muted); font-size: 13px; }
  .ess-two { display: grid; gap: 10px; grid-template-columns: 1.3fr 1fr; }
  .ess-switch { align-items: center; color: var(--foam); display: flex; justify-content: space-between; gap: 12px; margin-top: 14px; min-height: 48px; font-size: 15px; font-weight: 600; }
  .ess-end { margin-top: 10px; }
  .ess-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .form-actions-inner.ess-actions { flex-direction: column; align-items: stretch; gap: 6px; padding: 10px 16px; }
  .essential .field-missing { border-color: var(--border); }
  .ess-foot { color: var(--text-muted); font-size: 13px; text-align: center; margin: 0; }
  .fl-inp[type="date"], .fl-inp[type="time"] { display: flex; align-items: center; text-align: left; -webkit-appearance: none; appearance: none; }

  /* ── Dati uscita (menu a righe, mockup 37) ── */
  .data-menu { display: flex; flex-direction: column; gap: 10px; padding-bottom: calc(100px + env(safe-area-inset-bottom)); }
  .menu-row { align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; color: var(--foam); cursor: pointer; display: flex; gap: 14px; min-height: 72px; padding: 14px 16px; text-align: left; width: 100%; box-sizing: border-box; }
  .menu-icon { width: 44px; height: 44px; border-radius: 14px; background: var(--surface-2); color: rgb(var(--color-ocean-text)); display: flex; align-items: center; justify-content: center; flex: none; }
  .menu-text { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
  .menu-text strong { font-size: 16px; font-weight: 700; }
  .menu-text small { color: var(--text-muted); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .menu-status { color: rgb(var(--color-sand-text)); font-size: 12px; font-weight: 700; flex: none; }
  .menu-status.done { color: rgb(var(--color-success-text)); }
  .menu-go { color: var(--text-muted); flex: none; }
  .section-bar { align-items: center; display: flex; flex-direction: column; gap: .25rem; margin-bottom: 1rem; }
  .section-bar h3 { color: var(--foam); font-size: 1.2rem; margin: 0; }
  .link-back { align-items: center; align-self: flex-start; background: none; border: none; color: var(--ocean); cursor: pointer; display: inline-flex; font-weight: 600; gap: .3rem; padding: .4rem 0; }
  .single-section .accordion-header, .single-section .section-desc { display: none; }
  .delete-link { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 52px; border-radius: 16px; background: transparent; border: 1px solid #7f1d1d; color: #fca5a5; cursor: pointer; font-size: 15px; font-weight: 700; margin-top: 18px; }
</style>
