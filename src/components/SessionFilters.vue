<template>
  <div class="card grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 p-3 mb-5">
    <input
      :value="modelValue.search"
      type="search"
      :placeholder="t('sessionFilters.searchPlaceholder')"
      class="col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[140px] sm:max-w-xs"
      @input="update('search', $event.target.value)"
    />
    <select
      :value="modelValue.technique"
      class="col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[140px] sm:max-w-[180px]"
      @change="update('technique', $event.target.value)"
    >
      <option value="">{{ t('sessionFilters.allTechniques') }}</option>
      <option v-for="t in TECHNIQUES" :key="t.v" :value="t.v">{{ t.l }}</option>
    </select>
    <input
      :value="modelValue.dateFrom"
      type="date"
      class="sm:flex-1 sm:min-w-[130px] sm:max-w-[160px]"
      @change="update('dateFrom', $event.target.value)"
    />
    <span class="hidden sm:inline text-muted text-xs">→</span>
    <input
      :value="modelValue.dateTo"
      type="date"
      class="sm:flex-1 sm:min-w-[130px] sm:max-w-[160px]"
      @change="update('dateTo', $event.target.value)"
    />
    <button v-if="hasFilters" class="btn btn-ghost btn-sm shrink-0 col-span-2 sm:col-span-1" style="display:inline-flex;align-items:center;gap:.4rem" @click="$emit('reset')">
      <X :size="14" /> {{ t('sessionFilters.reset') }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'

const { t } = useI18n()
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