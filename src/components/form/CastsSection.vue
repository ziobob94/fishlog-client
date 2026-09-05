<template>
  <div class="flex flex-col gap-3">
    <div v-for="(cast, i) in modelValue" :key="i" class="card">
      <div class="flex items-center justify-between mb-3">
        <strong class="text-sm font-bold text-foam">{{ t('castsSection.itemTitle', { n: i + 1 }) }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="remove(i)">{{ t('baitsSection.remove') }}</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>{{ t('castsSection.distanceLabel') }}</label>
          <input v-model.number="cast.distance" type="number" min="0" :placeholder="t('castsSection.distancePlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('castsSection.directionLabel') }}</label>
          <input v-model="cast.direction" type="text" :placeholder="t('castsSection.directionPlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('castsSection.rigLabel') }}</label>
          <input v-model="cast.rig" type="text" :placeholder="t('castsSection.rigPlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('castsSection.baitLabel') }}</label>
          <input v-model="cast.bait" type="text" :placeholder="t('castsSection.baitPlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('castsSection.resultLabel') }}</label>
          <select v-model="cast.result">
            <option value="">--</option>
            <option value="cattura">{{ t('castsSection.resultCatch') }}</option>
            <option value="abboccata">{{ t('castsSection.resultBite') }}</option>
            <option value="niente">{{ t('castsSection.resultNothing') }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('castsSection.notesLabel') }}</label>
          <input v-model="cast.notes" type="text" />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm self-start" @click="add">{{ t('castsSection.add') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit  = defineEmits(['update:modelValue'])
const empty  = () => ({ distance:null, direction:'', rig:'', bait:'', result:'', notes:'' })
const add    = () => emit('update:modelValue', [...props.modelValue, empty()])
const remove = i => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
</script>