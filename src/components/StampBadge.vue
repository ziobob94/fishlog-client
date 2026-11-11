<template>
  <!-- Timbro per i traguardi (record, prima cattura, 10 uscite) -->
  <div class="stamp" :style="{ width: size + 'px', height: size + 'px' }" role="img" :aria-label="`${title} ${value} ${unit}`">
    <span class="stamp-title">{{ title }}</span>
    <span class="stamp-value">{{ value }}</span>
    <span class="stamp-unit">{{ unit }}</span>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'RECORD' },
  value: { type: [String, Number], required: true },
  unit:  { type: String, default: '' },
  size:  { type: Number, default: 88 },
})
</script>

<style scoped>
.stamp { border-radius: 50%; border: 2px dashed rgb(var(--color-sand-text)); color: rgb(var(--color-sand-text));
  display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(-8deg); }
.stamp { box-sizing: border-box; }
.stamp-title { font-size: 10px; font-weight: 800; letter-spacing: .16em; }
.stamp-value { font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 22px; line-height: 1.1; }
.stamp-unit  { font-size: 10px; font-weight: 700; }
</style>
