<template>
  <div class="flex flex-wrap bg-surface border border-border rounded-lg overflow-hidden mb-6">
    <div
      v-for="item in items"
      :key="item.label"
      class="flex flex-col gap-0.5 px-5 py-3 border-r border-border last:border-r-0"
    >
      <span class="text-muted text-[0.72rem] font-bold uppercase tracking-wide">{{ item.label }}</span>
      <span class="text-lg font-bold" :class="item.class">{{ item.value }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ items: { type: Array, required: true } })
</script>