<template>
  <div class="card grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 p-3 mb-5">
    <input
      :value="modelValue.search"
      type="search"
      :placeholder="t('market.filters.searchPlaceholder')"
      class="col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[140px] sm:max-w-xs"
      @input="update('search', $event.target.value)"
    />
    <select :value="modelValue.category" class="sm:flex-1 sm:min-w-[140px] sm:max-w-[180px]" @change="update('category', $event.target.value)">
      <option value="">{{ t('market.filters.allCategories') }}</option>
      <option v-for="c in categories" :key="c" :value="c">{{ t(`market.categories.${c}`) }}</option>
    </select>
    <select :value="modelValue.condition" class="sm:flex-1 sm:min-w-[120px] sm:max-w-[150px]" @change="update('condition', $event.target.value)">
      <option value="">{{ t('market.filters.allConditions') }}</option>
      <option value="nuovo">{{ t('market.condition.nuovo') }}</option>
      <option value="usato">{{ t('market.condition.usato') }}</option>
    </select>
    <select v-if="showSellerType" :value="modelValue.sellerType" class="sm:flex-1 sm:min-w-[120px] sm:max-w-[150px]" @change="update('sellerType', $event.target.value)">
      <option value="">{{ t('market.filters.allSellers') }}</option>
      <option value="privato">{{ t('market.sellerType.privato') }}</option>
      <option value="negozio">{{ t('market.sellerType.negozio') }}</option>
    </select>
    <input
      v-if="showLocation"
      :value="modelValue.location"
      type="text"
      :placeholder="t('market.filters.locationPlaceholder')"
      class="sm:flex-1 sm:min-w-[120px] sm:max-w-[160px]"
      @input="update('location', $event.target.value)"
    />
    <div class="col-span-2 sm:col-span-1 flex items-center gap-2">
      <input
        :value="modelValue.priceMin"
        type="number" min="0"
        :placeholder="t('market.filters.priceMin')"
        class="sm:w-24"
        @input="update('priceMin', $event.target.value)"
      />
      <span class="text-muted text-xs">→</span>
      <input
        :value="modelValue.priceMax"
        type="number" min="0"
        :placeholder="t('market.filters.priceMax')"
        class="sm:w-24"
        @input="update('priceMax', $event.target.value)"
      />
    </div>
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
const props = defineProps({
  modelValue: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  showSellerType: { type: Boolean, default: true },
  showLocation: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'reset'])

const hasFilters = computed(() => Object.values(props.modelValue).some(v => v))

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
