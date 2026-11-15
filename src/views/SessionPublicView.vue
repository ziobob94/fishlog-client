<template>
  <div class="pub">
    <div v-if="loading" class="state-center"><div class="m-spinner"></div></div>
    <div v-else-if="invalid" class="state-center">
      <h1 class="font-display text-2xl">{{ t('session.share.invalid') }}</h1>
      <p class="text-muted mt-1">{{ t('session.share.invalidNote') }}</p>
    </div>
    <template v-else-if="data">
      <div v-if="data.photos.length" class="slider">
        <div v-for="(p, i) in data.photos" :key="i" class="slide"><img :src="p.url" :alt="p.caption || ''" loading="lazy" /></div>
      </div>
      <header class="head">
        <p class="text-xs text-muted">{{ fmtDate(data.date) }}<template v-if="data.author"> · {{ t('session.share.by', { name: data.author }) }}</template></p>
        <h1 class="font-display text-2xl">{{ data.title || t('session.untitled') }}</h1>
        <p v-if="data.place" class="place"><MapPin :size="15" aria-hidden="true" /> {{ data.place }}</p>
        <div class="badges">
          <span v-if="data.technique" class="badge badge-ocean">{{ data.technique }}</span>
          <span v-if="data.duration" class="badge badge-sand">{{ data.duration.hours }}h{{ data.duration.minutes ? ' ' + String(data.duration.minutes).padStart(2, '0') : '' }}</span>
        </div>
      </header>
      <section>
        <TideDivider>{{ t('session.view.sections.catches', { n: data.totalCatches }) }}</TideDivider>
        <p v-if="!data.catches.length" class="text-muted">{{ t('session.share.noCatches') }}</p>
        <ul class="catches">
          <li v-for="(c, i) in data.catches" :key="i">
            <strong>{{ c.species }}</strong>
            <span class="text-muted">{{ [c.lengthCm && `${fmt(c.lengthCm)} cm`, c.weightKg && `${fmt(c.weightKg)} kg`, c.released && t('session.view.released').toLowerCase()].filter(Boolean).join(' · ') }}</span>
          </li>
        </ul>
      </section>
      <footer class="foot">
        <RouterLink to="/" class="fl-btn1">{{ t('session.share.cta') }}</RouterLink>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MapPin } from 'lucide-vue-next'
import TideDivider from '../components/TideDivider.vue'
import { sessionShareApi } from '../utils/sessionShare.js'

const { t } = useI18n()
const route = useRoute()
const data = ref(null), loading = ref(true), invalid = ref(false)
const fmt = v => String(v).replace('.', ',')
const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })

onMounted(async () => {
  try { data.value = await sessionShareApi.publicView(route.params.token) }
  catch { invalid.value = true }
  finally { loading.value = false }
})
</script>

<style scoped>
.pub { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.state-center { display: flex; flex-direction: column; align-items: center; padding: 4rem 1rem; text-align: center; }
.slider { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; border-radius: 20px; background: rgb(var(--color-ink)); }
.slider::-webkit-scrollbar { display: none; }
.slide { flex: 0 0 100%; scroll-snap-align: center; height: 280px; }
.slide img { width: 100%; height: 100%; object-fit: contain; display: block; }
.head { display: flex; flex-direction: column; gap: 6px; }
.place { display: flex; align-items: center; gap: 6px; color: var(--text-muted); margin: 0; }
.badges { display: flex; gap: 8px; flex-wrap: wrap; }
.catches { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.catches li { display: flex; flex-direction: column; gap: 2px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 12px 14px; }
.foot { padding: 8px 0 2rem; }
.fl-btn1 { text-decoration: none; }
</style>
