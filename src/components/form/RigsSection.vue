<template>
  <div class="flex flex-col gap-3">
    <div v-for="(rig, i) in modelValue" :key="i" class="card">
      <div class="flex items-center justify-between mb-3">
        <strong class="text-sm font-bold text-foam">{{ t('rigsSection.itemTitle', { n: i + 1 }) }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="remove(i)">{{ t('baitsSection.remove') }}</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>{{ t('rigsSection.nameLabel') }}</label>
          <input v-model="rig.name" type="text" :placeholder="t('rigsSection.namePlaceholder')" required />
        </div>
        <div class="form-group">
          <label>{{ t('rigsSection.typeLabel') }}</label>
          <input v-model="rig.type" type="text" :placeholder="t('rigsSection.typePlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('rigsSection.hookSizeLabel') }}</label>
          <input v-model="rig.hookSize" type="text" :placeholder="t('rigsSection.hookSizePlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('rigsSection.hookTypeLabel') }}</label>
          <input v-model="rig.hookType" type="text" :placeholder="t('rigsSection.hookTypePlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('rigsSection.sinkerWeightLabel') }}</label>
          <input v-model.number="rig.sinkerWeight" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>{{ t('rigsSection.sinkerTypeLabel') }}</label>
          <input v-model="rig.sinkerType" type="text" :placeholder="t('rigsSection.sinkerTypePlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('rigsSection.lineMainLabel') }}</label>
          <input v-model.number="rig.lineMainLb" type="number" step="0.1" min="0" />
        </div>
        <div class="form-group">
          <label>{{ t('rigsSection.leaderLabel') }}</label>
          <input v-model.number="rig.leaderLb" type="number" step="0.1" min="0" />
        </div>
        <div class="form-group">
          <label>{{ t('rigsSection.swivelLabel') }}</label>
          <input v-model="rig.swivel" type="text" :placeholder="t('rigsSection.swivelPlaceholder')" />
        </div>
        <div class="form-group full">
          <label>{{ t('rigsSection.notesLabel') }}</label>
          <input v-model="rig.notes" type="text" :placeholder="t('rigsSection.notesPlaceholder')" />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm self-start" @click="add">{{ t('rigsSection.add') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit  = defineEmits(['update:modelValue'])
const empty  = () => ({ name:'', type:'', hookSize:'', hookType:'', sinkerWeight:null, sinkerType:'', lineMainLb:null, leaderLb:null, swivel:'', notes:'' })
const add    = () => emit('update:modelValue', [...props.modelValue, empty()])
const remove = i => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
</script>