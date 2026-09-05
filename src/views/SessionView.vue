<template>
  <div>
    <div v-if="store.loading && !session" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!session" class="state-center">
      <p class="text-muted">{{ t('session.view.notFound') }}</p>
      <RouterLink to="/" class="btn btn-ghost btn-sm mt-2">{{ t('session.view.backToList') }}</RouterLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <RouterLink to="/" class="btn btn-ghost btn-sm">{{ t('session.view.allSessions') }}</RouterLink>
          <div class="detail-title-block">
            <div class="detail-meta">
              <span class="text-mono text-muted">{{ fmtDate(session.date) }}</span>
              <span v-if="session.technique" class="badge badge-ocean">{{ session.technique }}</span>
              <span v-if="session.visibility !== 'private'" class="badge badge-sand">{{ visibilityLabel(session.visibility) }}</span>
              <span v-if="session.rating" class="stars">{{ '★'.repeat(session.rating) }}</span>
            </div>
            <h1>{{ session.title || session.location?.name || t('session.untitled') }}</h1>
            <p v-if="session.location?.spot" class="text-muted">
              📍 {{ session.location.spot }} — {{ session.location.region }}
            </p>
          </div>
        </div>
        <div class="detail-header-actions">
          <RouterLink :to="`/session/${session._id}/edit`" class="btn btn-secondary">{{ t('groups.editAction') }}</RouterLink>
          <button class="btn btn-danger" @click="confirmDelete = true">{{ t('groups.deleteAction') }}</button>
        </div>
      </div>

      <!-- Stats -->
      <StatBar v-if="statItems.length" :items="statItems" />

      <div class="detail-grid">
        <div class="detail-main">

          <!-- Media -->
          <section class="detail-section">
            <h3 class="section-title">{{ t('session.view.sections.media') }}</h3>
            <MediaUploader :session-id="session._id" :media="session.media || []" @update="reload" />
          </section>

          <!-- Luogo -->
          <section class="detail-section">
            <h3 class="section-title">{{ t('session.view.sections.location') }}</h3>
            <div class="info-grid">
              <InfoItem :label="t('session.view.fields.name')"       :value="session.location?.name" />
              <InfoItem :label="t('session.view.fields.spot')"       :value="session.location?.spot" />
              <InfoItem :label="t('session.view.fields.region')"    :value="session.location?.region" />
              <InfoItem :label="t('session.view.fields.coordinates')" :value="coordsLabel" mono />
            </div>
            <p v-if="session.location?.notes" class="notes-text mt-1">{{ session.location.notes }}</p>
            <MapDisplay
              v-if="session.location?.coords?.lat && session.location?.coords?.lng"
              :lat="session.location.coords.lat"
              :lng="session.location.coords.lng"
              class="mt-3"
            />
          </section>

          <!-- Condizioni acqua -->
          <section v-if="hasSea" class="detail-section">
            <h3 class="section-title">{{ waterSectionTitle }}</h3>
            <div class="info-grid">
              <InfoItem v-if="isSea" :label="t('session.view.fields.seaState')"   :value="seaStateLabel(session.sea?.seaState)" />
              <InfoItem v-if="isSea" :label="t('session.view.fields.waves')"         :value="session.sea?.waveHeight" />
              <InfoItem v-if="isSea" :label="t('session.view.fields.wavePeriod')"      :value="session.sea?.wavePeriod" />
              <InfoItem v-if="isRiver" :label="t('session.view.fields.level')"    :value="waterLevelLabel(session.sea?.waterLevel)" />
              <InfoItem :label="t('session.view.fields.current')"                  :value="session.sea?.current" />
              <InfoItem :label="t('session.view.fields.waterColor')"              :value="session.sea?.waterColor" />
              <InfoItem :label="t('session.view.fields.waterTemp')"               :value="session.sea?.waterTemp != null ? `${session.sea.waterTemp}°C` : null" />
              <InfoItem v-if="isSea" :label="t('session.view.fields.tide')"        :value="tideLabel(session.sea?.tide?.state)" />
              <InfoItem v-if="isSea" :label="t('session.view.fields.tideNotes')"   :value="session.sea?.tide?.notes" />
            </div>
          </section>

          <!-- Meteo -->
          <section v-if="hasWeather" class="detail-section">
            <h3 class="section-title">{{ t('session.view.weather.title') }}</h3>
            <div class="info-grid">
              <InfoItem :label="t('session.view.fields.condition')"  :value="session.weather?.condition" />
              <InfoItem :label="t('session.view.fields.wind')"       :value="session.weather?.windDirection" />
              <InfoItem :label="t('session.view.fields.windSpeed')"  :value="session.weather?.windSpeed != null ? `${session.weather.windSpeed} km/h` : null" />
              <InfoItem :label="t('session.view.fields.tempAir')"  :value="session.weather?.tempAir != null ? `${session.weather.tempAir}°C` : null" />
              <InfoItem :label="t('session.view.fields.pressure')"   :value="session.weather?.pressure != null ? `${session.weather.pressure} hPa` : null" />
            </div>
            <p v-if="session.weather?.notes" class="notes-text mt-1">{{ session.weather.notes }}</p>
          </section>

          <!-- Esche -->
          <section v-if="session.baits?.length" class="detail-section">
            <h3 class="section-title">{{ t('session.view.sections.baits', { n: session.baits.length }) }}</h3>
            <div class="item-cards">
              <div v-for="(b, i) in session.baits" :key="i" class="item-card card">
                <div class="item-card-header">
                  <strong>{{ b.name }}</strong>
                  <span v-if="b.type" class="badge badge-ocean">{{ b.type }}</span>
                </div>
                <div class="info-grid sm">
                  <InfoItem :label="t('session.view.fields.presentation')" :value="b.presentation" />
                  <InfoItem :label="t('session.view.fields.notes')"          :value="b.notes" />
                </div>
              </div>
            </div>
          </section>

          <!-- Montature -->
          <section v-if="session.rigs?.length" class="detail-section">
            <h3 class="section-title">{{ t('session.view.sections.rigs', { n: session.rigs.length }) }}</h3>
            <div class="item-cards">
              <div v-for="(r, i) in session.rigs" :key="i" class="item-card card">
                <div class="item-card-header">
                  <strong>{{ r.name }}</strong>
                  <span v-if="r.type" class="badge badge-sand">{{ r.type }}</span>
                </div>
                <div class="info-grid sm">
                  <InfoItem :label="t('session.view.fields.hook')"       :value="r.hookSize ? `${r.hookSize}${r.hookType ? ' — ' + r.hookType : ''}` : r.hookType" />
                  <InfoItem :label="t('session.view.fields.sinker')"    :value="r.sinkerWeight != null ? `${r.sinkerWeight}g${r.sinkerType ? ' (' + r.sinkerType + ')' : ''}` : null" />
                  <InfoItem :label="t('session.view.fields.line')"      :value="r.lineMainLb != null ? `${r.lineMainLb} lb` : null" />
                  <InfoItem :label="t('session.view.fields.leader')" :value="r.leaderLb != null ? `${r.leaderLb} lb` : null" />
                  <InfoItem :label="t('session.view.fields.swivel')"   :value="r.swivel" />
                  <InfoItem :label="t('session.view.fields.notes')"      :value="r.notes" />
                </div>
              </div>
            </div>
          </section>

          <!-- Lanci -->
          <section v-if="session.casts?.length" class="detail-section">
            <h3 class="section-title">{{ t('session.view.sections.casts', { n: session.casts.length }) }}</h3>
            <CastsTable :casts="session.casts" />
          </section>

          <!-- Catture -->
          <section v-if="session.catches?.length" class="detail-section">
            <h3 class="section-title">{{ t('session.view.sections.catches', { n: session.catches.length }) }}</h3>
            <div class="item-cards">
              <div v-for="(c, i) in session.catches" :key="i" class="item-card card catch-card">
                <div class="item-card-header">
                  <strong class="text-ocean">{{ c.species }}</strong>
                  <span v-if="c.released" class="badge badge-success">{{ t('session.view.released') }}</span>
                </div>
                <div class="info-grid sm">
                  <InfoItem :label="t('session.view.fields.weight')"      :value="c.weightKg != null ? `${c.weightKg} kg` : null" />
                  <InfoItem :label="t('session.view.fields.length')" :value="c.lengthCm != null ? `${c.lengthCm} cm` : null" />
                  <InfoItem :label="t('session.view.fields.time')"       :value="c.time" />
                  <InfoItem :label="t('session.view.fields.distance')"  :value="c.distance != null ? `${c.distance}m` : null" />
                  <InfoItem :label="t('session.view.fields.bait')"      :value="c.baitUsed" />
                  <InfoItem :label="t('session.view.fields.rig')" :value="c.rigUsed" />
                  <InfoItem :label="t('session.view.fields.notes')"      :value="c.notes" />
                </div>
              </div>
            </div>
          </section>

          <!-- Note -->
          <section v-if="session.notes" class="detail-section">
            <h3 class="section-title">{{ t('session.view.sections.notes') }}</h3>
            <p class="notes-text">{{ session.notes }}</p>
          </section>
        </div>

        <!-- Sidebar -->
        <aside class="detail-side">
          <div class="card side-card">
            <p class="side-label">{{ t('session.view.sideLabels.technique') }}</p>
            <p class="side-value">{{ session.technique || t('common.none') }}</p>
          </div>
          <div class="card side-card">
            <p class="side-label">{{ t('session.view.sideLabels.visibility') }}</p>
            <p class="side-value">{{ visibilityLabel(session.visibility) }}</p>
          </div>
          <div v-if="session.rating" class="card side-card">
            <p class="side-label">{{ t('session.view.sideLabels.rating') }}</p>
            <p class="stars" style="font-size:1.4rem">{{ '★'.repeat(session.rating) }}</p>
          </div>
          <div class="card side-card">
            <p class="side-label">{{ t('session.view.sideLabels.registeredAt') }}</p>
            <p class="side-value text-mono" style="font-size:.82rem">{{ fmtDatetime(session.createdAt) }}</p>
          </div>
        </aside>
      </div>
    </template>

    <!-- Confirm delete -->
    <Teleport to="body">
      <div v-if="confirmDelete" class="dialog-overlay" @click.self="confirmDelete = false">
        <div class="dialog card">
          <h3>{{ t('session.view.deleteDialog.title') }}</h3>
          <p class="text-muted mt-1">{{ t('session.view.deleteDialog.confirm') }}</p>
          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.25rem">
            <button class="btn btn-ghost btn-sm" @click="confirmDelete = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-danger btn-sm" :disabled="deleting" @click="doDelete">
              {{ deleting ? t('session.view.deleteDialog.deleting') : t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '../stores/sessions.js'
import MediaUploader from '../components/MediaUploader.vue'
import InfoItem      from '../components/InfoItem.vue'
import StatBar       from '../components/StatBar.vue'
import CastsTable    from '../components/CastsTable.vue'
import MapDisplay    from '../components/MapDisplay.vue'

const { t }  = useI18n()
const store  = useSessionStore()
const route  = useRoute()
const router = useRouter()

const confirmDelete = ref(false)
const deleting      = ref(false)
const session       = computed(() => store.current)

const hasSea     = computed(() => session.value?.sea && Object.values(session.value.sea).some(v => v && v !== '' && typeof v !== 'object'))
const hasWeather = computed(() => session.value?.weather && Object.values(session.value.weather).some(v => v && v !== '' && typeof v !== 'object'))

const coordsLabel = computed(() => {
  const c = session.value?.location?.coords
  return c?.lat ? `${c.lat}, ${c.lng}` : null
})

const statItems = computed(() => {
  const s = session.value
  const items = []
  if (s?.startTime) items.push({ label: t('session.view.statLabels.time'), value: `${s.startTime}${s.endTime ? ' → ' + s.endTime : ''}` })
  if (s?.totalCatches) items.push({ label: t('session.view.statLabels.catches'), value: s.totalCatches, class: 'text-ocean' })
  if (s?.bestCatch) items.push({ label: t('session.view.statLabels.best'), value: s.bestCatch, class: 'text-sand' })
  return items
})

const visibilityLabel = v => ({ private: t('session.view.visibility.private'), users: t('session.view.visibility.users'), group: t('session.view.visibility.group') }[v] || v)
const seaStateLabel   = v => ({ piatto: t('session.view.seaState.piatto'), poco_mosso: t('session.view.seaState.poco_mosso'), mosso: t('session.view.seaState.mosso'), molto_mosso: t('session.view.seaState.molto_mosso'), agitato: t('session.view.seaState.agitato') }[v] || v)
const waterLevelLabel = v => ({ piena: t('session.view.waterLevel.piena'), normale: t('session.view.waterLevel.normale'), magra: t('session.view.waterLevel.magra') }[v] || v)
const tideLabel       = v => ({ crescente: t('session.view.tideState.crescente'), calante: t('session.view.tideState.calante'), alta: t('session.view.tideState.alta'), bassa: t('session.view.tideState.bassa') }[v] || v)

const isSea   = computed(() => !session.value?.waterType || session.value?.waterType === 'mare')
const isRiver = computed(() => session.value?.waterType === 'fiume')
const waterSectionTitle = computed(() => ({
  mare: t('session.view.water.sea'), fiume: t('session.view.water.river'),
  lago: t('session.view.water.lake'),  altro: t('session.view.water.other'),
}[session.value?.waterType] || t('session.view.water.sea')))

const fmtDate     = d => new Date(d).toLocaleDateString('it-IT', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })
const fmtDatetime = d => new Date(d).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })

function reload() { store.fetchSession(route.params.id) }
onMounted(() => store.fetchSession(route.params.id))

async function doDelete() {
  deleting.value = true
  const ok = await store.deleteSession(route.params.id)
  if (ok) router.push('/')
  deleting.value = false
}
</script>

<style scoped>
.detail-header       { @apply flex flex-wrap items-start justify-between gap-4 mb-6; }
.detail-header-left  { @apply flex flex-col gap-3; }
.detail-meta         { @apply flex flex-wrap items-center gap-2; }
.detail-header-actions { @apply flex gap-2 flex-wrap; }

.detail-grid  { @apply grid gap-5; grid-template-columns: 1fr 220px; }
.detail-main  { @apply flex flex-col; }
.detail-side  { @apply flex flex-col gap-3; }

.detail-section { @apply border-b border-border mb-6 pb-6 last:border-b-0; }
.section-title  { @apply text-sm font-bold mb-3 text-foam; }

.info-grid    { @apply grid gap-2; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
.info-grid.sm { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }

.notes-text { @apply text-foam text-sm leading-relaxed whitespace-pre-wrap; }

.item-cards     { @apply flex flex-col gap-2; }
.item-card      { @apply p-4; }
.item-card-header { @apply flex flex-wrap items-center gap-2 mb-2; }
.catch-card     { @apply border-ocean/25; }

.side-card  { @apply p-3; }
.side-label { @apply text-muted text-[0.7rem] font-bold uppercase tracking-wide mb-0.5; }
.side-value { @apply text-sm font-semibold text-foam; }

.dialog-overlay { @apply fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center; }
.dialog         { @apply max-w-sm w-[90%]; }

@media (max-width: 768px) {
  .detail-grid { grid-template-columns: 1fr; }
  .detail-side { @apply flex-row flex-wrap; order: -1; }
  .side-card   { @apply flex-1 min-w-[120px]; }
}
</style>