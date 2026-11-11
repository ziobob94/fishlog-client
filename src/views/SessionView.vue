<template>
  <div class="detail">
    <div v-if="store.loading && !session" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!session" class="state-center">
      <p class="text-muted">{{ t('session.view.notFound') }}</p>
      <RouterLink to="/sessions" class="btn btn-ghost btn-sm mt-2">{{ t('session.view.backToList') }}</RouterLink>
    </div>

    <template v-else>
      <div v-if="session._pending" class="pending-banner icon-inline">
        <Hourglass :size="14" /> {{ t('offline.sessionPendingNotice') }}
      </div>

      <!-- Foto in alto, con cornice a metro e contatore -->
      <section class="d-hero">
        <div v-if="media.length" ref="slider" class="slider" @scroll.passive="onSlide">
          <div v-for="m in media" :key="m._id" class="slide">
            <img v-if="m.type === 'photo'" :src="m.url" :alt="m.caption || ''" loading="lazy" />
            <video v-else :src="m.url" controls preload="metadata"></video>
          </div>
        </div>
        <div v-else class="hero-empty"><ImageIcon :size="52" :stroke-width="1.6" /></div>
        <button type="button" class="hero-btn hero-back" :aria-label="t('common.back')" @click="router.push('/sessions')"><ChevronLeft :size="22" /></button>
        <RouterLink v-if="isOwner" :to="`/session/${session._id}/edit`" class="hero-btn hero-edit" :aria-label="t('groups.editAction')"><Pencil :size="18" /></RouterLink>
        <span v-if="media.length" class="fl-mono hero-count">{{ slideIndex + 1 }}/{{ media.length }} {{ t('session.view.photoWord') }}</span>
        <div class="hero-ticks" aria-hidden="true"></div>
        <div class="hero-major" aria-hidden="true"></div>
      </section>

      <div class="d-body">
        <StampBadge v-if="session.record" class="d-stamp" title="RECORD" :value="session.record.lengthCm" :unit="`cm · ${(session.record.species || '').toLowerCase()}`" :size="92" />
        <div class="d-meta">
          <span class="fl-mono d-date">{{ fmtShort(session.date) }}</span>
          <span v-if="session.technique" class="badge badge-ocean">{{ session.technique }}</span>
          <span v-if="session.visibility !== 'private'" class="badge badge-sand">{{ visibilityLabel(session.visibility) }}</span>
          <span v-if="session.rating" class="stars" :aria-label="`${session.rating}/5`">{{ '★'.repeat(session.rating) }}</span>
        </div>
        <h1 class="d-title">{{ title }}</h1>
        <p v-if="placeLine" class="d-place"><MapPin :size="15" /> {{ placeLine }}</p>
        <p v-if="coordsLabel" class="coords-pill fl-mono">{{ coordsLabel }}</p>

        <!-- Statistiche -->
        <div class="d-stats" :style="{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }">
          <div v-for="st in stats" :key="st.label">
            <span class="st-lab">{{ st.label }}</span>
            <span class="fl-mono st-val" :class="st.cls">{{ st.value }}<small v-if="st.unit">{{ st.unit }}</small></span>
          </div>
        </div>

        <!-- Condizioni -->
        <section v-if="conditions.length" class="d-sec">
          <TideDivider>{{ t('session.view.conditions') }}</TideDivider>
          <div class="cond-grid">
            <div v-for="c in conditions" :key="c.label" class="cond">
              <span class="c-lab">{{ c.label }}</span>
              <strong class="c-val">{{ c.value }}</strong>
            </div>
          </div>
        </section>

        <!-- Catture -->
        <section v-if="session.catches?.length" class="d-sec">
          <TideDivider>{{ t('session.view.sections.catches', { n: session.catches.length }) }}</TideDivider>
          <div class="catch-list">
            <div v-for="c in session.catches" :key="c._id" class="catch" :class="{ open: openCatch === c._id }">
              <button type="button" class="catch-head" :aria-expanded="openCatch === c._id" @click="openCatch = openCatch === c._id ? null : c._id">
                <span class="fl-mono time-chip">{{ c.time || '--:--' }}</span>
                <span class="catch-main">
                  <strong class="catch-name">{{ c.species }}</strong>
                  <span class="catch-sum">{{ catchSummary(c) }}</span>
                </span>
                <ChevronDown :size="20" class="chev" />
              </button>
              <div v-if="openCatch === c._id" class="catch-body">
                <RouterLink v-if="c.species" :to="`/species/${encodeURIComponent(c.species)}`" class="species-link">{{ t('session.view.speciesCard') }} →</RouterLink>
                <span v-if="c.released" class="badge badge-success">{{ t('session.view.released') }}</span>
                <div class="info-grid sm">
                  <InfoItem :label="t('session.view.fields.weight')"      :value="c.weightKg != null ? `${c.weightKg} kg` : null" />
                  <InfoItem :label="t('session.view.fields.length')" :value="c.lengthCm != null ? `${c.lengthCm} cm` : null" />
                  <InfoItem :label="t('session.view.fields.distance')"  :value="c.distance != null ? `${c.distance}m` : null" />
                  <InfoItem :label="t('session.view.fields.direction')" :value="c.direction" />
                  <InfoItem :label="t('session.view.fields.bait')"      :value="c.baitUsed" />
                  <InfoItem :label="t('session.view.fields.baitType')"  :value="c.baitType" />
                  <InfoItem :label="t('session.view.fields.presentation')" :value="c.baitPresentation" />
                  <InfoItem :label="t('session.view.fields.rig')"       :value="c.rigUsed" />
                  <InfoItem :label="t('session.view.fields.hook')"      :value="c.hookSize ? `${c.hookSize}${c.hookType ? ' — ' + c.hookType : ''}` : c.hookType" />
                  <InfoItem :label="t('session.view.fields.sinker')"    :value="c.sinkerWeight != null ? `${c.sinkerWeight}g${c.sinkerType ? ' (' + c.sinkerType + ')' : ''}` : null" />
                  <InfoItem :label="t('session.view.fields.line')"      :value="c.lineMainLb != null ? `${c.lineMainLb} lb` : null" />
                  <InfoItem :label="t('session.view.fields.leader')"    :value="c.leaderLb != null ? `${c.leaderLb} lb` : null" />
                  <InfoItem :label="t('session.view.fields.swivel')"    :value="c.swivel" />
                  <InfoItem :label="t('session.view.fields.notes')"     :value="c.notes" />
                </div>
                <MediaUploader
                  class="mt-3"
                  :session-id="session._id"
                  :media="c.media || []"
                  :upload-url="`/media/upload/${session._id}/catch/${c._id}`"
                  :item-base-url="`/media/${session._id}/catch/${c._id}`"
                  @update="reload"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Luogo -->
        <section v-if="hasPlace" class="d-sec">
          <TideDivider>{{ t('session.view.sections.location') }}</TideDivider>
          <MapDisplay
            v-if="session.location?.coords?.lat && session.location?.coords?.lng"
            :lat="session.location.coords.lat"
            :lng="session.location.coords.lng"
            class="d-map"
          />
          <p v-if="session.location?.notes" class="notes-text mt-2">{{ session.location.notes }}</p>
        </section>

        <!-- Note -->
        <section v-if="session.notes" class="d-sec">
          <TideDivider>{{ t('session.view.sections.notes') }}</TideDivider>
          <p class="notes-text">{{ session.notes }}</p>
        </section>

        <!-- Foto e video: gestione per l'autore -->
        <section v-if="isOwner && !session._pending" class="d-sec">
          <button type="button" class="manage-media" :aria-expanded="showMedia" @click="showMedia = !showMedia">
            <Camera :size="18" /> {{ t('session.view.sections.media') }}
            <ChevronDown :size="18" class="chev" :class="{ flip: showMedia }" />
          </button>
          <MediaUploader v-if="showMedia" class="mt-3" :session-id="session._id" :media="session.media || []" @update="reload" />
        </section>

        <div v-if="isOwner" class="d-actions">
          <RouterLink :to="`/session/${session._id}/edit`" class="act act-edit">{{ t('groups.editAction') }}</RouterLink>
          <button type="button" class="act act-del" @click="confirmDelete = true">{{ t('groups.deleteAction') }}</button>
        </div>
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
import { elapsedLabel } from '../utils/sessionTime.js'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Hourglass, MapPin, Pencil, Camera, ChevronLeft, ChevronDown, Image as ImageIcon } from 'lucide-vue-next'
import { useSessionStore } from '../stores/sessions.js'
import { useAuthStore } from '../stores/auth.js'
import MediaUploader from '../components/MediaUploader.vue'
import InfoItem      from '../components/InfoItem.vue'
import MapDisplay    from '../components/MapDisplay.vue'
import TideDivider   from '../components/TideDivider.vue'
import StampBadge    from '../components/StampBadge.vue'

const { t }  = useI18n()
const store  = useSessionStore()
const auth   = useAuthStore()
// Solo l'autore può modificare/eliminare (il server applica lo stesso controllo).
// Le uscite offline in coda non hanno ancora un autore dal server: sono sempre mie.
const isOwner = computed(() => {
  const s = store.current
  if (!s) return false
  if (s._pending || !s.userId) return true
  const me = auth.user?._id || auth.user?.id
  return String(s.userId?._id || s.userId) === String(me)
})
const route  = useRoute()
const router = useRouter()

const confirmDelete = ref(false)
const deleting      = ref(false)
const session       = computed(() => store.current)

const title = computed(() => session.value?.title || session.value?.location?.name || t('session.untitled'))
const media = computed(() => session.value?.media || [])
const slider = ref(null)
const slideIndex = ref(0)
function onSlide() {
  const el = slider.value
  if (el) slideIndex.value = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
}
const showMedia = ref(false)
const openCatch = ref(null)

const placeLine = computed(() => {
  const l = session.value?.location
  const first = l?.spot || (l?.name && l.name !== title.value ? l.name : '')
  return [first, l?.region].filter(Boolean).join(' · ')
})
const coordsLabel = computed(() => {
  const c = session.value?.location?.coords
  return c?.lat && c?.lng ? `${Number(c.lat).toFixed(2)}°N · ${Number(c.lng).toFixed(2)}°E` : null
})
const hasPlace = computed(() => !!(session.value?.location?.coords?.lat || session.value?.location?.notes))

const bestLen = computed(() => Math.max(0, ...(session.value?.catches || []).map(c => Number(c.lengthCm) || 0)))
const duration = computed(() => {
  const s = session.value
  if (!s?.startTime || !s?.endTime) return null
  const [h, m] = elapsedLabel(s).split(':').map(Number)
  return { h, m }
})
const stats = computed(() => {
  const s = session.value
  const out = [{ label: t('session.view.statLabels.catches'), value: s?.catches?.length ?? s?.totalCatches ?? 0 }]
  if (bestLen.value) out.push({ label: t('session.view.statLabels.bestCm'), value: String(bestLen.value).replace('.', ','), unit: ' cm', cls: 'amber' })
  if (duration.value) out.push({ label: t('session.view.statLabels.duration'), value: `${duration.value.h}h`, unit: duration.value.m ? ` ${String(duration.value.m).padStart(2, '0')}` : '' })
  return out
})

const num = v => v != null && v !== ''
const conditions = computed(() => {
  const s = session.value, out = []
  const add = (label, value) => { if (value != null && value !== '') out.push({ label, value }) }
  const sea = s?.sea || {}, w = s?.weather || {}
  if (isSea.value) add(t('session.view.fields.seaState'), seaStateLabel(sea.seaState))
  if (isSea.value) add(t('session.view.conditionLabels.tide'), tideLabel(sea.tide?.state))
  if (isRiver.value) add(t('session.view.fields.level'), waterLevelLabel(sea.waterLevel))
  if (w.windDirection || num(w.windSpeed)) add(t('session.view.conditionLabels.wind'), [w.windDirection, num(w.windSpeed) ? `${w.windSpeed} km/h` : ''].filter(Boolean).join(' · '))
  if (num(sea.waterTemp) || num(w.tempAir)) add(t('session.view.conditionLabels.waterAir'), [num(sea.waterTemp) ? `${sea.waterTemp}°` : '–', num(w.tempAir) ? `${w.tempAir}°C` : '–'].join(' / '))
  add(t('session.view.fields.condition'), w.condition)
  if (isSea.value) add(t('session.view.fields.waves'), num(sea.waveHeight) ? `${sea.waveHeight} m` : null)
  if (isSea.value) add(t('session.view.fields.wavePeriod'), num(sea.wavePeriod) ? `${sea.wavePeriod} s` : null)
  add(t('session.view.fields.current'), sea.current)
  add(t('session.view.fields.waterColor'), sea.waterColor)
  add(t('session.view.fields.pressure'), num(w.pressure) ? `${w.pressure} hPa` : null)
  return out
})

function catchSummary(c) {
  const parts = []
  if (c.lengthCm) parts.push(`${String(c.lengthCm).replace('.', ',')} cm`)
  if (c.weightKg) parts.push(`${String(c.weightKg).replace('.', ',')} kg`)
  const bait = [c.baitUsed, c.rigUsed].filter(Boolean)[0]
  if (bait) parts.push(bait)
  if (c.released) parts.push(t('session.view.released').toLowerCase())
  return parts.join(' · ') || t('session.ongoing.noDetails')
}

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
const waterSectionIcon = computed(() => ({
  mare: Waves, fiume: Trees, lago: Mountain, altro: Droplet,
}[session.value?.waterType] || Waves))

const fmtShort = d => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '')

function reload() { store.fetchSession(route.params.id) }
onMounted(() => store.fetchSession(route.params.id))

async function doDelete() {
  deleting.value = true
  const ok = await store.deleteSession(route.params.id)
  if (ok) router.push('/sessions')
  deleting.value = false
}
</script>

<style scoped>
.detail { margin: -1rem -1rem 0; }
@media (min-width: 640px) { .detail { margin: 0 auto; max-width: 720px; } }
.state-center { display: flex; flex-direction: column; align-items: center; padding: 4rem 1rem; }
.pending-banner { @apply bg-sand/10 border border-sand text-sand-text rounded-sm text-sm px-4 py-3 m-4; }
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }

.d-hero { position: relative; height: 240px; background: linear-gradient(160deg, var(--surface-2), rgb(var(--color-sea-deep))); overflow: hidden; }
@media (min-width: 640px) { .d-hero { border-radius: 24px 24px 24px 8px; height: 320px; } }
.slider { display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.slider::-webkit-scrollbar { display: none; }
.slide { flex: 0 0 100%; scroll-snap-align: center; height: 100%; }
.slide img, .slide video { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero-empty { height: 100%; display: flex; align-items: center; justify-content: center; color: rgb(var(--color-ocean-text) / .45); }
.hero-btn { position: absolute; top: 14px; width: 44px; height: 44px; border-radius: 14px; background: rgb(var(--color-ink) / .72); border: 1px solid var(--border); color: var(--foam); display: flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; backdrop-filter: blur(6px); }
.hero-back { left: 14px; }
.hero-edit { right: 14px; }
.hero-count { position: absolute; left: 14px; bottom: 40px; font-size: 12px; padding: 5px 10px; border-radius: 12px; background: rgb(var(--color-ink) / .75); color: var(--foam); }
.hero-ticks { position: absolute; left: 12px; right: 12px; bottom: 10px; height: 10px; pointer-events: none; background: repeating-linear-gradient(90deg, rgba(241,245,249,.85) 0 2px, transparent 2px 10px); }
.hero-major { position: absolute; left: 12px; right: 12px; bottom: 10px; height: 18px; pointer-events: none; background: repeating-linear-gradient(90deg, rgb(var(--color-sand-text)) 0 2px, transparent 2px 50px); }

.d-body { position: relative; padding: 16px 16px 8.5rem; display: flex; flex-direction: column; gap: 14px; }
.d-stamp { position: absolute; right: 16px; top: 12px; transform: rotate(8deg); }
.d-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.d-date { font-size: 13px; color: var(--text-muted); }
.stars { color: rgb(var(--color-sand-text)); letter-spacing: 2px; }
.d-title { font-size: 30px; line-height: 1.1; margin: 0; color: var(--foam); padding-right: 100px; }
.d-place { display: flex; align-items: center; gap: 6px; font-size: 15px; color: var(--text-muted); margin: 0; }
.coords-pill { align-self: flex-start; border: 1px solid rgb(var(--color-ocean-text) / .4); border-radius: 999px; padding: 4px 12px; font-size: 12px; color: rgb(var(--color-ocean-text)); margin: 0; }

.d-stats { display: grid; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }
.d-stats > div { padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.d-stats > div + div { border-left: 1px solid var(--border); }
.st-lab { font-size: 13px; color: var(--text-muted); font-weight: 600; }
.st-val { font-size: 34px; line-height: 1; letter-spacing: -.04em; color: var(--foam); }
.st-val.amber { color: rgb(var(--color-sand-text)); }
.st-val small { font-size: 13px; letter-spacing: 0; color: var(--text-muted); font-weight: 500; }

.d-sec { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
.cond-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.cond { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.c-lab { font-size: 13px; color: var(--text-muted); }
.c-val { font-family: var(--font-display); font-size: 16px; font-weight: 800; letter-spacing: -.01em; color: var(--foam); overflow-wrap: anywhere; }

.catch-list { display: flex; flex-direction: column; gap: 10px; }
.catch { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; }
.catch-head { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; background: none; border: 0; color: var(--foam); text-align: left; cursor: pointer; min-height: 64px; }
.time-chip { flex: none; background: rgba(14, 165, 233, .16); color: rgb(var(--color-ocean-text)); border-radius: 10px; padding: 8px 8px; font-size: 13px; }
.catch-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.catch-name { font-family: var(--font-display); font-size: 17px; font-weight: 800; letter-spacing: -.01em; }
.catch-sum { font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chev { color: var(--text-muted); flex: none; transition: transform .15s; }
.catch.open .chev, .chev.flip { transform: rotate(180deg); }
.catch-body { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.catch-body > * { width: 100%; }
.species-link { color: rgb(var(--color-ocean-text)); font-weight: 700; text-decoration: none; font-size: 14px; }
.info-grid.sm { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }

.d-map { border-radius: 24px 24px 24px 8px; overflow: hidden; }
.notes-text { color: var(--foam); font-size: 15px; line-height: 1.55; white-space: pre-wrap; margin: 0; }
.manage-media { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 48px; padding: 0 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; color: var(--foam); font-weight: 700; cursor: pointer; }
.manage-media .chev { margin-left: auto; }

.d-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
.act { min-height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; text-decoration: none; cursor: pointer; }
.act-edit { background: var(--surface-2); border: 1px solid var(--border-light); color: var(--foam); }
.act-del { background: transparent; border: 1px solid #7f1d1d; color: rgb(var(--color-danger-text)); }

.dialog-overlay { @apply fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center; }
.dialog         { @apply max-w-sm w-[90%]; }
</style>
