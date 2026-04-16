<template>
  <div v-if="value != null && value !== ''" class="flex flex-col gap-0.5">
    <span class="text-muted text-[0.7rem] font-bold uppercase tracking-wide">{{ label }}</span>
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