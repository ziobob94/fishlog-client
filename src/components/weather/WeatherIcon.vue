<template><component :is="icon" :size="size" aria-hidden="true" /></template>
<script setup>
import { computed } from 'vue'
import { Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, CloudRain, Wind, Minus } from 'lucide-vue-next'
const props = defineProps({ condition: { type: String, default: null }, isDay: { type: Boolean, default: true }, size: { type: Number, default: 24 } })
const icon = computed(() => ({
  sole: props.isDay === false ? Moon : Sun, nuvoloso: props.isDay === false ? CloudMoon : CloudSun, coperto: Cloud,
  nebbia: CloudFog, pioggia: CloudRain, vento: Wind,
}[props.condition] || Minus))
</script>
