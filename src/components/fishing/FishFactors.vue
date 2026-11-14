<template>
  <!-- Pill dei fattori: freccia ↑ → ↓ decorativa, il significato è nel testo nascosto «favorisce / neutro / sfavorisce». -->
  <span class="ff" :class="{ 'ff-sm': small }">
    <span v-for="f in items" :key="f.key" class="ff-pill" :class="`ff-${f.effect}`">
      <span class="ff-name">{{ t(`fishAct.factors.${f.key}`) }}</span>
      <span class="ff-arrow" aria-hidden="true">{{ ARROW[f.effect] }}</span>
      <span class="ff-sr">{{ t(`fishAct.effect.${f.effect}`) }}</span>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { visibleFactors, EFFECT_ARROW as ARROW } from '../../utils/fishActivity.js'

const props = defineProps({ factors: { type: Array, default: () => [] }, small: Boolean })
const { t } = useI18n()
const items = computed(() => visibleFactors(props.factors))
</script>

<style scoped>
.ff { display: flex; flex-wrap: wrap; gap: 6px; }
.ff-pill { position: relative; display: inline-flex; align-items: center; gap: 5px; min-height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid rgb(var(--color-border-light)); background: rgb(var(--color-surface-2)); font-size: .8rem; font-weight: 700; }
.ff-arrow { font-family: var(--font-mono); font-weight: 700; }
.ff-up .ff-arrow { color: rgb(var(--color-ocean-text)); }
.ff-down .ff-arrow { color: rgb(var(--color-sand-text)); }
.ff-flat .ff-arrow { color: rgb(var(--color-muted)); }
.ff-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
