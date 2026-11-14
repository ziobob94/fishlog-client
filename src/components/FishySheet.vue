<template>
  <!-- Foglio globale di Fishy: parla o scrivi da qualsiasi pagina. Esc chiude e il focus resta dentro (BottomSheet). -->
  <BottomSheet :model-value="open" :label="t('fishy.title')" @update:model-value="v => { if (!v) hide() }">
    <div class="fs">
      <div class="fs-head">
        <Fishy :expression="EXPRESSION[state]" :size="56" avatar />
        <h2>{{ t('fishy.title') }}</h2>
        <button type="button" class="fs-x" :aria-label="t('createMenu.close')" @click="hide"><X :size="22" /></button>
      </div>
      <p class="fs-sub"><span v-if="sessions.ongoing" class="dot" aria-hidden="true"></span>{{ sub }}</p>
      <FishyPanel closable @close="hide" />
    </div>
  </BottomSheet>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import BottomSheet from './motion/BottomSheet.vue'
import FishyPanel from './form/FishyPanel.vue'
import Fishy from './Fishy.vue'
import { useSessionStore } from '../stores/sessions.js'
import { useFishySheet } from '../composables/useFishySheet.js'
import { useFishyVoice } from '../composables/useFishyVoice.js'
import { EXPRESSION } from '../utils/fishyFab.js'

const { t } = useI18n()
const sessions = useSessionStore()
const { open, hide } = useFishySheet()
const { state } = useFishyVoice()
// Dice a che punto sei: con un'uscita in corso luogo e ora d'inizio, altrimenti come cominciarne una.
const sub = computed(() => {
  const o = sessions.ongoing
  if (!o) return t('fishy.subNone')
  const place = o.location?.name || o.title || t('session.untitled')
  return o.startTime ? t('fishy.subOngoingAt', { place, time: o.startTime }) : t('fishy.subOngoing', { place })
})
</script>

<style scoped>
.fs { display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; }
.fs-head { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
.fs-head h2 { flex: 1; font-size: 22px; font-weight: 800; margin: 0; color: var(--foam); }
.fs-x { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: 0; color: var(--foam); cursor: pointer; }
.fs-sub { margin: -4px 0 0; font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: rgb(var(--color-success)); flex: none; }
</style>
