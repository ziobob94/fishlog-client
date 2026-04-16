<template>
  <div v-if="pages > 1" class="flex items-center justify-center gap-4 mt-8">
    <button class="btn btn-ghost btn-sm" :disabled="current <= 1" @click="$emit('change', current - 1)">
      ← Prec
    </button>
    <span class="font-mono text-muted text-sm">{{ current }} / {{ pages }}</span>
    <button class="btn btn-ghost btn-sm" :disabled="current >= pages" @click="$emit('change', current + 1)">
      Succ →
    </button>
  </div>
</template>

<script setup>
defineProps({ current: { type: Number, required: true }, pages: { type: Number, required: true } })
defineEmits(['change'])
</script>