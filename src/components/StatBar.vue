<template>
  <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-px sm:gap-0 bg-border sm:bg-surface border border-border rounded-signature overflow-hidden mb-5">
    <div
      v-for="item in items"
      :key="item.label"
      class="flex flex-col gap-0.5 px-4 sm:px-5 py-3 bg-surface sm:border-r sm:border-border sm:last:border-r-0 min-w-0"
    >
      <span class="text-muted text-xs font-bold uppercase" style="letter-spacing:0.14em">{{ item.label }}</span>
      <span class="text-2xl sm:text-3xl font-bold leading-tight break-words" :class="[item.class, isNum(item.value) ? 'font-mono' : '']">{{ item.value }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ items: { type: Array, required: true } })
// Monospace solo per i valori numerici (kg, cm, conteggi); i testi restano nel font normale
const isNum = v => /^[\d.,:\s°/+\-–]+\s?[a-zA-Z%°/]{0,5}$/.test(String(v ?? '').trim())
</script>