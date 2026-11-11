<template>
  <span class="wx-wind">
    <span v-if="info.calm" class="wx-dot" role="img" :aria-label="t('weather.wind.calm')" />
    <svg v-else-if="info.arrow != null" class="wx-arrow" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" :style="{ transform: `rotate(${info.arrow}deg)` }">
      <path d="M12 3v15M6 12l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span v-else class="wx-dash" aria-hidden="true">{{ MISSING }}</span>
    <span v-if="info.calm" class="wx-wind-tx">{{ t('weather.wind.calm') }}</span>
    <span v-else-if="info.from" class="wx-wind-tx">
      {{ t('weather.wind.from') }} <abbr :title="info.name">{{ info.abbr }}</abbr> · <span class="wx-num">{{ info.deg }}°</span>
    </span>
  </span>
</template>

<script setup>
// Freccia = verso dove soffia il vento; testo = da dove arriva («da NO · 315°»). Calmo = pallino, nessuna freccia.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { windInfo, MISSING } from '../../utils/weather.js'
const props = defineProps({ speed: { type: Number, default: null }, deg: { type: Number, default: null } })
const { t } = useI18n()
const info = computed(() => windInfo(props.speed, props.deg))
</script>
