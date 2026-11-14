<template>
  <!-- Foglio globale: detta una cattura all'uscita in corso da qualsiasi pagina. -->
  <BottomSheet :model-value="open && !!session" :label="t('voice.title')" @update:model-value="v => { if (!v) hide() }">
    <div class="vs">
      <div class="vs-head">
        <h2>{{ t('voice.sheetTitle') }}</h2>
        <button type="button" class="vs-x" :aria-label="t('createMenu.close')" @click="hide"><X :size="22" /></button>
      </div>
      <p class="vs-sub">{{ session?.title || session?.location?.name || t('session.untitled') }}</p>
      <VoiceCatch v-if="session" :session="session" />
    </div>
  </BottomSheet>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import BottomSheet from './motion/BottomSheet.vue'
import VoiceCatch from './form/VoiceCatch.vue'
import { useSessionStore } from '../stores/sessions.js'
import { useVoiceSheet } from '../composables/useVoiceSheet.js'

const { t } = useI18n()
const sessions = useSessionStore()
const { open, hide } = useVoiceSheet()
const session = computed(() => sessions.ongoing)
</script>

<style scoped>
.vs { display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; }
.vs-head { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
.vs-head h2 { font-size: 22px; font-weight: 800; margin: 0; color: var(--foam); }
.vs-x { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: 0; color: var(--foam); cursor: pointer; }
.vs-sub { margin: -6px 0 0; font-size: 13px; color: var(--text-muted); }
</style>
