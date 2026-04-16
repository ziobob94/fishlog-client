<template>
  <header class="sticky top-0 z-[100] flex items-center gap-4 px-5 py-3 border-b border-border"
    style="background: rgba(13,17,23,0.92); backdrop-filter: blur(12px)">
    <button
      class="flex flex-col gap-1.5 p-1 bg-transparent border-none cursor-pointer group"
      @click="$emit('toggle-sidebar')"
    >
      <span class="block w-5 h-0.5 bg-foam rounded group-hover:bg-ocean transition-colors duration-200"></span>
      <span class="block w-5 h-0.5 bg-foam rounded group-hover:bg-ocean transition-colors duration-200"></span>
      <span class="block w-5 h-0.5 bg-foam rounded group-hover:bg-ocean transition-colors duration-200"></span>
    </button>
    <RouterLink to="/" class="text-foam text-lg font-extrabold tracking-tight hover:text-ocean transition-colors">
      🎣 FishLog
    </RouterLink>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'
defineEmits(['toggle-sidebar'])
</script>