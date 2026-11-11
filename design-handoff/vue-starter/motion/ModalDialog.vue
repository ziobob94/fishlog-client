<template>
  <!-- Dialogo di conferma: scala .96 → 1 + dissolvenza. Entrata 200 ms --ease-enter, uscita 120 ms --ease-exit.
       Uso: <ModalDialog v-model="open" title="Annullare la cattura?" destructive> testo … <template #actions> …bottoni… </template> </ModalDialog> -->
  <Teleport to="body">
    <Transition name="sheet-backdrop">
      <div v-if="modelValue" class="modal-backdrop" aria-hidden="true" @click="close" />
    </Transition>
    <Transition name="modal">
      <div v-if="modelValue" class="modal-wrap" @keydown.esc.stop="close">
        <div ref="box" class="modal-box" :role="destructive ? 'alertdialog' : 'dialog'" aria-modal="true" :aria-labelledby="id" tabindex="-1">
          <h2 :id="id" class="font-display modal-title">{{ title }}</h2>
          <div class="modal-text"><slot /></div>
          <div class="modal-actions"><slot name="actions" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
const props = defineProps({ modelValue: Boolean, title: { type: String, required: true }, destructive: Boolean })
const emit = defineEmits(['update:modelValue'])
const box = ref(null), id = `dlg-${Math.random().toString(36).slice(2, 8)}`
let opener = null
const close = () => emit('update:modelValue', false)
watch(() => props.modelValue, async (o) => {
  if (o) { opener = document.activeElement; await nextTick(); box.value?.focus() } else opener?.focus?.()
})
</script>

<style>
.modal-backdrop { position: fixed; inset: 0; z-index: 50; background: rgb(5 10 18 / var(--backdrop-opacity)); }
.modal-wrap { position: fixed; inset: 0; z-index: 51; display: flex; align-items: center; justify-content: center; padding: 24px; pointer-events: none; }
.modal-box { pointer-events: auto; width: 100%; max-width: 340px; background: rgb(var(--color-surface)); border: 1px solid rgb(var(--color-border-light));
  border-radius: 24px 24px 24px 8px; padding: 20px; outline: none; }
.modal-title { margin: 0 0 8px; font-size: 20px; font-weight: 800; }
.modal-text { font-size: 15px; line-height: 1.5; color: rgb(var(--color-muted)); }
.modal-actions { display: grid; gap: 8px; margin-top: 16px; }
</style>
