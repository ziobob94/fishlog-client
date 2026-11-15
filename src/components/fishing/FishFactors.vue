<template>
  <!-- Fattori col dato concreto («Pressione in calo ↓», «Vento 18 km/h ↑»); senza il dato, la parola generica («Luce favorevole»).
       La freccia dice se il fattore favorisce (↑), è neutro (→) o sfavorisce (↓): il significato è anche nel testo per i lettori di schermo. -->
  <ul class="ff" :class="{ 'ff-sm': small }">
    <li v-for="f in items" :key="f.key" class="ff-item" :class="`ff-${f.effect}`">
      <span class="ff-dot" aria-hidden="true"></span>
      <template v-if="f.detail">{{ t(`fishAct.factorData.${f.detail.id}`, f.detail.params || {}) }} <span class="ff-arrow" aria-hidden="true">{{ ARROW[f.effect] }}</span><span class="ff-sr">{{ t(`fishAct.effect.${f.effect}`) }}</span></template>
      <template v-else>{{ t(`fishAct.factorText.${f.key}.${f.effect}`) }}</template>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { visibleFactors, factorDetail, EFFECT_ARROW as ARROW } from '../../utils/fishActivity.js'

const props = defineProps({ factors: { type: Array, default: () => [] }, small: Boolean, view: { type: Object, default: null } })
const { t } = useI18n()
const items = computed(() => visibleFactors(props.factors).map(f => ({ ...f, detail: factorDetail(f.key, props.view) })))
</script>

<style scoped>
.ff { display: flex; flex-wrap: wrap; gap: 4px 14px; list-style: none; margin: 0; padding: 0; }
.ff-item { display: inline-flex; align-items: center; gap: 6px; font-size: .85rem; color: rgb(var(--color-foam)); }
.ff-arrow { font-weight: 800; }
.ff-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ff-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: rgb(var(--color-muted)); }
.ff-up .ff-dot { background: rgb(var(--color-ocean-text)); }
.ff-down .ff-dot { background: rgb(var(--color-sand-text)); }
</style>
