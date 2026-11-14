<template>
  <!-- Fattori in parole: «Luce favorevole». Il pallino è decorativo, il significato è nel testo. -->
  <ul class="ff" :class="{ 'ff-sm': small }">
    <li v-for="f in items" :key="f.key" class="ff-item" :class="`ff-${f.effect}`">
      <span class="ff-dot" aria-hidden="true"></span>{{ t(`fishAct.factorText.${f.key}.${f.effect}`) }}
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { visibleFactors } from '../../utils/fishActivity.js'

const props = defineProps({ factors: { type: Array, default: () => [] }, small: Boolean })
const { t } = useI18n()
const items = computed(() => visibleFactors(props.factors))
</script>

<style scoped>
.ff { display: flex; flex-wrap: wrap; gap: 4px 14px; list-style: none; margin: 0; padding: 0; }
.ff-item { display: inline-flex; align-items: center; gap: 6px; font-size: .85rem; color: rgb(var(--color-foam)); }
.ff-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: rgb(var(--color-muted)); }
.ff-up .ff-dot { background: rgb(var(--color-ocean-text)); }
.ff-down .ff-dot { background: rgb(var(--color-sand-text)); }
</style>
