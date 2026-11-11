<template>
  <div v-if="value != null && value !== ''" class="flex flex-col gap-0.5">
    <span class="text-muted text-xs font-bold uppercase" style="letter-spacing:0.14em">{{ label }}</span>
    <span class="text-sm text-foam" :class="{ 'font-mono': mono }">{{ value }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: null },
  mono:  { type: Boolean, default: false }
})
</script>