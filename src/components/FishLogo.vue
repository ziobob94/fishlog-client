<template>
  <span class="fishlogo" :style="{ gap: Math.round(size * 0.25) + 'px' }">
    <span class="fishlogo-tile" :style="tileStyle">
      <svg :width="size * 0.7" :height="size * 0.7" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="none" :stroke="fg" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="translate(-2.4 0)">
          <path d="M8 33c0-10 10-17 22-17s19 7 19 17-8 17-19 17S8 43 8 33Z" />
          <path d="M47 33l10-10a2 2 0 0 1 3.4 1.4v17.2a2 2 0 0 1-3.4 1.4L47 33Z" />
        </g>
        <circle cx="17" cy="28" r="3.6" :fill="fg" />
        <circle cx="18.2" cy="26.8" r="1.2" :fill="bg" />
        <path d="M11.5 37.5c2.5 3 6.5 3.5 9.5 1" fill="none" :stroke="fg" stroke-width="3" stroke-linecap="round" />
      </svg>
    </span>
    <span v-if="!markOnly" class="fishlogo-word" :style="{ fontSize: size * 0.75 + 'px' }">
      <span :style="{ color: fish }">Fish</span><span :style="{ color: log }">Log</span>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme.js'

// variant: 'dark' (fondo scuro, predefinito) | 'light' (fondo chiaro)
const props = defineProps({
  size:     { type: Number, default: 40 },
  variant:  { type: String, default: '' },
  markOnly: { type: Boolean, default: false },
})

const theme = useThemeStore()
// Senza variante esplicita segue il tema dell'app
const light = computed(() => (props.variant || theme.mode) === 'light')
const bg   = computed(() => (light.value ? '#0369a1' : '#0ea5e9'))
const fg   = computed(() => (light.value ? '#ffffff' : '#0b1623'))
const fish = computed(() => (light.value ? '#0b1623' : '#f1f5f9'))
const log  = computed(() => (light.value ? '#b45309' : '#fbbf24'))
const tileStyle = computed(() => ({
  width: props.size + 'px', height: props.size + 'px',
  borderRadius: Math.round(props.size * 0.3) + 'px', background: bg.value,
}))
</script>

<style scoped>
.fishlogo { display: inline-flex; align-items: center; }
.fishlogo-tile { display: inline-flex; align-items: center; justify-content: center; flex: none; }
.fishlogo-word { font-family: 'Manrope', system-ui, sans-serif; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
</style>
