<template>
  <div class="card flex flex-wrap items-center gap-2.5 p-3 mb-5">
    <input
      :value="modelValue.search"
      type="search"
      placeholder="Cerca luogo, note..."
      class="flex-1 min-w-[140px] max-w-xs"
      @input="update('search', $event.target.value)"
    />
    <select
      :value="modelValue.technique"
      class="flex-1 min-w-[140px] max-w-[180px]"
      @change="update('technique', $event.target.value)"
    >
      <option value="">Tutte le tecniche</option>
      <option v-for="t in TECHNIQUES" :key="t.v" :value="t.v">{{ t.l }}</option>
    </select>
    <input
      :value="modelValue.dateFrom"
      type="date"
      class="flex-1 min-w-[130px] max-w-[160px]"
      @change="update('dateFrom', $event.target.value)"
    />
    <span class="text-muted text-xs">→</span>
    <input
      :value="modelValue.dateTo"
      type="date"
      class="flex-1 min-w-[130px] max-w-[160px]"
      @change="update('dateTo', $event.target.value)"
    />
    <button v-if="hasFilters" class="btn btn-ghost btn-sm shrink-0" @click="$emit('reset')">
      ✕ Reset
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit  = defineEmits(['update:modelValue', 'reset'])

const TECHNIQUES = [
  { v:'surfcasting', l:'Surfcasting' }, { v:'feeder', l:'Feeder' },
  { v:'spinning', l:'Spinning' },       { v:'bolentino', l:'Bolentino' },
  { v:'mosca', l:'Mosca' },             { v:'altro', l:'Altro' }
]

const hasFilters = computed(() =>
  props.modelValue.search || props.modelValue.technique ||
  props.modelValue.dateFrom || props.modelValue.dateTo
)

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>