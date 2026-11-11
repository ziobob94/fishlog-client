<template>
  <section aria-labelledby="wx-gl-h">
    <h2 id="wx-gl-h" class="wx-h">{{ t('weather.glance.title') }}</h2>
    <div class="wx-grid wx-grid-3">
      <div class="wx-block">
        <h3 class="wx-sub" style="margin:0 0 8px">{{ t('weather.glance.moon') }}</h3>
        <div style="display:flex;gap:12px;align-items:center">
          <MoonIcon :phase="f.moon.phase" :illumination="f.moon.illumination" :label="moonLabel(f.moon.phase)" />
          <div><p style="margin:0;font-weight:800">{{ moonLabel(f.moon.phase) }}</p>
            <p class="wx-sub" style="margin:2px 0 0"><span class="wx-num">{{ percent(f.moon.illumination) }}</span> % {{ t('weather.glance.lit') }}</p></div>
        </div>
      </div>
      <div class="wx-block">
        <h3 class="wx-sub" style="margin:0 0 8px">{{ t('weather.glance.sun') }}</h3>
        <p style="margin:0;display:flex;gap:16px"><span>{{ t('weather.glance.dawn') }} <span class="wx-num">{{ hhmm(f.sunrise) }}</span></span><span>{{ t('weather.glance.dusk') }} <span class="wx-num">{{ hhmm(f.sunset) }}</span></span></p>
        <p class="wx-sub" style="margin:6px 0 0"><template v-if="light"><span class="wx-num">{{ light.hours }}</span> h <span class="wx-num">{{ String(light.minutes).padStart(2, '0') }}</span> min {{ t('weather.glance.ofLight') }}</template><template v-else>{{ MISSING }}</template></p>
      </div>
      <div class="wx-block">
        <h3 class="wx-sub" style="margin:0 0 8px">{{ t('weather.glance.pressure') }}</h3>
        <PressureTrend :trend="f.pressure.trend" :delta="f.pressure.delta3h" :history="history" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MoonIcon from './MoonIcon.vue'
import PressureTrend from './PressureTrend.vue'
import { moonLabel, percent, hhmm, daylight, MISSING } from '../../utils/weather.js'
const props = defineProps({ view: { type: Object, required: true } })
const { t } = useI18n()
const f = computed(() => props.view.fishing)
const light = computed(() => daylight(f.value.sunrise, f.value.sunset))
const history = computed(() => f.value.pressure.history6h)
</script>
