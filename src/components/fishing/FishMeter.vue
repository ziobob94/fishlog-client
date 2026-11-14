<template>
  <!-- 5 segmenti: i primi «level» sono pieni. Il significato è nel testo (aria-label e parola), non nel colore. -->
  <span class="fm" :class="{ 'fm-sm': small }" role="img" :aria-label="label">
    <span v-for="n in 5" :key="n" class="fm-seg" :class="{ on: n <= level }" aria-hidden="true"></span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { levelKey } from '../../utils/fishActivity.js'

const props = defineProps({ level: { type: Number, required: true }, small: Boolean })
const { t } = useI18n()
const label = computed(() => t('fishAct.aria', { level: t(`fishAct.levels.${levelKey(props.level)}`).toLowerCase(), n: props.level }))
</script>

<style scoped>
.fm { display: inline-flex; gap: 4px; }
.fm-seg { width: 28px; height: 10px; border-radius: 4px; background: rgb(var(--color-surface-2)); border: 1px solid rgb(var(--color-border-light)); box-sizing: border-box; }
.fm-seg.on { background: var(--oct, rgb(var(--color-ocean-text))); border-color: var(--oct, rgb(var(--color-ocean-text))); }
.fm-sm { gap: 3px; }
.fm-sm .fm-seg { width: 14px; height: 6px; border-radius: 3px; }
</style>
