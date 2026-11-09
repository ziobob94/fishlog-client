<template>
  <div class="filters mb-5">
   <input
      :value="modelValue.search"
      type="search"
      :placeholder="t('sessionFilters.searchPlaceholder')"
      :aria-label="t('sessionFilters.searchPlaceholder')"
      class="search-field"
      @input="update('search', $event.target.value)"
    />
    <div class="chip-row" role="group" :aria-label="t('sessionFilters.allTechniques')">
      <button type="button" class="chip-btn" :class="{ active: !modelValue.technique }" :aria-pressed="!modelValue.technique" @click="update('technique', '')">{{ t('sessionFilters.all') }}</button>
      <button v-for="tq in TECHNIQUES" :key="tq.v" type="button" class="chip-btn" :class="{ active: modelValue.technique === tq.v }" :aria-pressed="modelValue.technique === tq.v" @click="update('technique', tq.v)">{{ tq.l }}</button>
    </div>
    <div class="card grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 p-3">
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
<style scoped>
.filters { @apply flex flex-col gap-3; }
.chip-row { @apply flex gap-2 overflow-x-auto pb-1; scrollbar-width: none; }
.chip-row::-webkit-scrollbar { display: none; }
.chip-btn {
  @apply shrink-0 inline-flex items-center min-h-[44px] px-4 rounded-full border border-border bg-surface text-foam text-sm font-semibold cursor-pointer transition-colors;
}
.chip-btn:hover { @apply border-ocean; }
.chip-btn.active { @apply bg-ocean border-ocean text-on-primary; }
</style>
