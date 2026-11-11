<template>
  <BottomSheet :model-value="modelValue" :label="t('weather.help.title')" @update:model-value="v => $emit('update:modelValue', v)">
    <div style="padding:4px 4px 18px">
      <h2 class="wx-h">{{ t('weather.help.title') }}</h2>
      <p class="wx-sub">{{ t('weather.help.intro') }}</p>
      <div v-for="g in groups" :key="g">
        <h3 class="wx-sub" style="font-weight:800;margin:12px 0 0;color:rgb(var(--color-foam))">{{ t(`weather.help.${g}.name`) }}</h3>
        <ol class="wx-steps"><li v-for="n in 3" :key="n">{{ t(`weather.help.${g}.s${n}`) }}</li></ol>
      </div>
      <button type="button" class="fl-btn1 m-press" @click="$emit('update:modelValue', false)">{{ t('weather.help.close') }}</button>
    </div>
  </BottomSheet>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import BottomSheet from '../motion/BottomSheet.vue'
defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue'])
const { t } = useI18n()
const groups = ['ios', 'android', 'desktop']
</script>
