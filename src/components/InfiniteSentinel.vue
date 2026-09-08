<template>
  <div ref="el" class="infinite-sentinel">
    <div v-if="loading" class="spinner"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  // Disattivato quando non c'è altro da caricare, per non tenere un
  // observer inutile appeso al fondo della lista.
  active: { type: Boolean, default: true },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['trigger'])

const el = ref(null)
let observer = null

function setup() {
  observer?.disconnect()
  if (!props.active || !el.value) return
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) emit('trigger')
  }, { rootMargin: '400px 0px' })
  observer.observe(el.value)
}

onMounted(setup)
watch(() => props.active, setup)
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.infinite-sentinel {
  @apply flex justify-center py-6;
  min-height: 2px;
}
</style>
