<template>
  <div class="flex flex-col gap-3">
    <div v-for="(c, i) in modelValue" :key="i" class="card border-ocean/25">
      <div class="flex items-center justify-between mb-3">
        <strong class="text-sm font-bold text-ocean">{{ t('catchesSection.itemTitle', { n: i + 1 }) }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="remove(i)">{{ t('baitsSection.remove') }}</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>{{ t('catchesSection.speciesLabel') }}</label>
          <input v-model="c.species" type="text" :placeholder="t('catchesSection.speciesPlaceholder')" required />
        </div>
        <div class="form-group">
          <label>{{ t('catchesSection.weightLabel') }}</label>
          <input v-model.number="c.weightKg" type="number" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label>{{ t('catchesSection.lengthLabel') }}</label>
          <input v-model.number="c.lengthCm" type="number" step="0.5" min="0" />
        </div>
        <div class="form-group">
          <label>{{ t('catchesSection.timeLabel') }}</label>
          <input v-model="c.time" type="time" />
        </div>
        <div class="form-group">
          <label>{{ t('catchesSection.distanceLabel') }}</label>
          <input v-model.number="c.distance" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>{{ t('catchesSection.releasedLabel') }}</label>
          <select v-model="c.released">
            <option :value="false">{{ t('catchesSection.releasedNo') }}</option>
            <option :value="true">{{ t('catchesSection.releasedYes') }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('catchesSection.baitUsedLabel') }}</label>
          <input v-model="c.baitUsed" type="text" />
        </div>
        <div class="form-group">
          <label>{{ t('catchesSection.rigUsedLabel') }}</label>
          <input v-model="c.rigUsed" type="text" />
        </div>
        <div class="form-group full">
          <label>{{ t('catchesSection.notesLabel') }}</label>
          <input v-model="c.notes" type="text" :placeholder="t('catchesSection.notesPlaceholder')" />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm self-start" @click="add">{{ t('catchesSection.add') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit  = defineEmits(['update:modelValue'])
const empty  = () => ({ species:'', weightKg:null, lengthCm:null, time:'', distance:null, released:false, baitUsed:'', rigUsed:'', notes:'' })
const add    = () => emit('update:modelValue', [...props.modelValue, empty()])
const remove = i => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
</script>