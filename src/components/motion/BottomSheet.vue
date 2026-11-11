<template>
  <!-- Foglio dal basso (Crea, menù del profilo, filtri, selettori).
       Entrata 320 ms --ease-enter, uscita 200 ms --ease-exit, sfondo che sfuma 200 ms, chiusura con swipe, Esc o tocco sullo sfondo.
       Uso: <BottomSheet v-model="open" label="Cosa vuoi condividere?"> …contenuto… </BottomSheet> -->
  <Teleport to="body">
    <Transition name="sheet-backdrop">
      <div v-if="modelValue" class="sheet-backdrop" :style="backdropStyle" aria-hidden="true" @click="close" />
    </Transition>
    <Transition name="sheet" :css="!swiped" @after-leave="swiped = false">
      <div
        v-if="modelValue" ref="sheet" class="sheet" role="dialog" aria-modal="true" :aria-label="label"
        tabindex="-1" @keydown.esc.stop="close" v-bind="drag.handlers"
      >
        <div class="sheet-grab" aria-hidden="true" />
        <div ref="scroller" class="sheet-body"><slot /></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useSwipeDismiss } from './motion.js'

const props = defineProps({ modelValue: Boolean, label: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const sheet = ref(null), scroller = ref(null)
const swiped = ref(false), progress = ref(0)
let opener = null

const close = () => emit('update:modelValue', false)
const drag = useSwipeDismiss(sheet, {
  scrollEl: scroller,
  onProgress: (p) => { progress.value = p },
  onDismiss: () => { swiped.value = true; progress.value = 0; close() },
})
const backdropStyle = computed(() => (drag.dragging.value || progress.value ? { opacity: 1 - progress.value } : undefined))

watch(() => props.modelValue, async (open) => {
  if (open) {
    opener = document.activeElement
    document.documentElement.style.overflow = 'hidden'
    await nextTick(); sheet.value?.focus()
  } else {
    document.documentElement.style.overflow = ''
    opener?.focus?.()
  }
})
onBeforeUnmount(() => { document.documentElement.style.overflow = '' })
</script>

<style>
.sheet-backdrop { position: fixed; inset: 0; z-index: 300; background: rgb(5 10 18 / var(--backdrop-opacity)); }
.sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 301; max-height: 88dvh; display: flex; flex-direction: column;
  background: rgb(var(--color-surface)); border-radius: 28px 28px 0 0; border-top: 1px solid rgb(var(--color-border-light));
  padding-bottom: env(safe-area-inset-bottom); outline: none; touch-action: none; }
.sheet-grab { align-self: center; width: 44px; height: 5px; border-radius: 3px; background: rgb(var(--color-border-light)); margin: 12px 0 6px; flex: none; }
.sheet-body { overflow-y: auto; overscroll-behavior: contain; padding: 0 16px 24px; touch-action: pan-y; }
</style>
