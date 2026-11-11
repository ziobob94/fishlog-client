<template>
  <!-- Icona meteo. Colore: sole e luna in sabbia, acqua in ocean, il resto neutro (currentColor se `plain`).
       Con `code` mostra l'icona della condizione (WMO), con `name` una delle icone dati/mare/luce. Decorativa: il testo sta accanto. -->
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="stroke"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" :style="plain ? undefined : { color: tone }">
    <path :d="weatherIcons[key]" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { weatherIcons, wmoToIcon } from './weather-icons.js'

const props = defineProps({
  code:   { type: Number, default: null },
  isDay:  { type: Boolean, default: true },
  name:   { type: String, default: '' },
  size:   { type: [Number, String], default: 28 },
  stroke: { type: [Number, String], default: 2 },
  plain:  Boolean,
})
const key = computed(() => props.name || wmoToIcon(props.code, props.isDay))
const SAND = ['sereno', 'poco-nuvoloso']
const MOON = ['sereno-notte', 'poco-nuvoloso-notte', 'luna', 'temporale', 'temporale-grandine', 'alba', 'tramonto']
const WATER = ['pioggerella', 'pioggia', 'pioggia-forte', 'rovescio', 'neve', 'umidita', 'pioggia-prob', 'onda', 'onda-lunga', 'marea-alta', 'marea-bassa', 'corrente', 'temp-mare']
const tone = computed(() => SAND.includes(key.value) ? 'rgb(var(--color-sand))'
  : MOON.includes(key.value) ? 'rgb(var(--color-sand-text))'
  : WATER.includes(key.value) ? 'rgb(var(--color-ocean-text))' : 'rgb(var(--color-foam))')
</script>
