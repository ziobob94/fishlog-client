<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="icons[name]" />
  </svg>
</template>

<script setup>
import { icons } from './icons.js'

defineProps({
  name:   { type: String, required: true },   // es. 'uscite', 'community', 'nuova-uscita'
  size:   { type: [Number, String], default: 20 },
  stroke: { type: [Number, String], default: 2 },
})
</script>
