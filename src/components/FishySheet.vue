<template>
  <!-- Foglio globale di Fishy: parla o scrivi da qualsiasi pagina. -->
  <BottomSheet :model-value="open" :label="t('fishy.title')" @update:model-value="v => { if (!v) hide() }">
    <div class="fs">
      <div class="fs-head">
        <h2>{{ t('fishy.title') }}</h2>
        <button type="button" class="fs-x" :aria-label="t('createMenu.close')" @click="hide"><X :size="22" /></button>
      </div>
      <p class="fs-sub">{{ sub }}</p>
      <FishyPanel />
    </div>
  </BottomSheet>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import BottomSheet from './motion/BottomSheet.vue'
import FishyPanel from './form/FishyPanel.vue'
import { useSessionStore } from '../stores/sessions.js'
import { useFishySheet } from '../composables/useFishySheet.js'

const { t } = useI18n()
const sessions = useSessionStore()
const { open, hide } = useFishySheet()
// Dice a che punto sei: con un'uscita in corso il luogo, altrimenti come cominciarne una.
const sub = computed(() => sessions.ongoing
  ? t('fishy.subOngoing', { place: sessions.ongoing.location?.name || sessions.ongoing.title || t('session.untitled') })
  : t('fishy.subNone'))
</script>

<style scoped>
.fs { display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; }
.fs-head { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
.fs-head h2 { font-size: 22px; font-weight: 800; margin: 0; color: var(--foam); }
.fs-x { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: 0; color: var(--foam); cursor: pointer; }
.fs-sub { margin: -6px 0 0; font-size: 13px; color: var(--text-muted); }
</style>
