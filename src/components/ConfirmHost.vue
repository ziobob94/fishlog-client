<template>
  <ModalDialog :model-value="confirmState.open" :title="confirmState.title || t('common.confirm')" :destructive="confirmState.destructive"
    @update:model-value="v => { if (!v) settleConfirm(false) }">
    {{ confirmState.message }}
    <template #actions>
      <button type="button" class="fl-btn1 m-press" :class="{ danger: confirmState.destructive }" @click="settleConfirm(true)">{{ confirmState.confirmLabel || t('common.confirm') }}</button>
      <button type="button" class="fl-btn2 m-press" @click="settleConfirm(false)">{{ confirmState.cancelLabel || t('common.cancel') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ModalDialog from './motion/ModalDialog.vue'
import { confirmState, settleConfirm } from '../composables/useConfirm.js'
const { t } = useI18n()
</script>
