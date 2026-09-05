<template>
  <div class="flex flex-col gap-3">
    <div v-for="(bait, i) in modelValue" :key="i" class="card">
      <div class="flex items-center justify-between mb-3">
        <strong class="text-sm font-bold text-foam">{{ t('baitsSection.itemTitle', { n: i + 1 }) }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="remove(i)">{{ t('baitsSection.remove') }}</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>{{ t('baitsSection.nameLabel') }}</label>
          <input v-model="bait.name" type="text" :placeholder="t('baitsSection.namePlaceholder')" required />
        </div>
        <div class="form-group">
          <label>{{ t('baitsSection.typeLabel') }}</label>
          <select v-model="bait.type">
            <option value="">--</option>
            <option value="naturale">{{ t('baitsSection.typeNatural') }}</option>
            <option value="artificiale">{{ t('baitsSection.typeArtificial') }}</option>
            <option value="misto">{{ t('baitsSection.typeMixed') }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('baitsSection.presentationLabel') }}</label>
          <input v-model="bait.presentation" type="text" :placeholder="t('baitsSection.presentationPlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('baitsSection.notesLabel') }}</label>
          <input v-model="bait.notes" type="text" :placeholder="t('baitsSection.notesPlaceholder')" />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm self-start" @click="add">{{ t('baitsSection.add') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit  = defineEmits(['update:modelValue'])
const add    = () => emit('update:modelValue', [...props.modelValue, { name:'', type:'', presentation:'', notes:'' }])
const remove = i => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
</script>