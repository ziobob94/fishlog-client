<template>
  <!-- Scelta breve come chip (radiogroup/radio). Selezionato = riempito + aria-checked; si può togliere
       toccando di nuovo (i campi sono facoltativi). Frecce per spostarsi. -->
  <div ref="root" class="chips" :class="`cols-${cols}`" role="radiogroup" :aria-labelledby="labelledby" :aria-label="label || undefined">
    <button v-for="(o, i) in options" :key="o.v" type="button" class="fl-chip chip" :class="{ on: modelValue === o.v, 'chip-sub': o.sub }"
      role="radio" :aria-checked="modelValue === o.v" :tabindex="tabIndexFor(o, i)"
      @click="pick(o)" @keydown="onKey($event, i)">
      <component :is="o.icon" v-if="o.icon" :size="18" aria-hidden="true" />
      <span class="chip-main">{{ o.l }}</span>
      <small v-if="o.sub" class="chip-small">{{ o.sub }}</small>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },   // [{ v, l, icon?, sub? }]
  labelledby: { type: String, default: undefined },
  label: { type: String, default: '' },
  cols: { type: Number, default: 2 }
})
const emit = defineEmits(['update:modelValue'])
const root = ref(null)

const pick = o => emit('update:modelValue', props.modelValue === o.v ? '' : o.v)
// roving tabindex: il selezionato (o il primo) è l'unico nel giro del Tab
function tabIndexFor(o, i) {
  const has = props.options.some(x => x.v === props.modelValue)
  return (has ? props.modelValue === o.v : i === 0) ? 0 : -1
}
function onKey(e, i) {
  const n = props.options.length
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
  if (!step) return
  e.preventDefault()
  const j = (i + step + n) % n
  emit('update:modelValue', props.options[j].v)
  root.value?.querySelectorAll('[role="radio"]')[j]?.focus()
}
</script>

<style scoped>
.chips { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.chips.cols-1 { grid-template-columns: minmax(0, 1fr); }
.chips.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.chips.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.chip { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 0 12px; border-radius: 24px; transition: background var(--motion-fast, 120ms) var(--ease-standard, ease), border-color var(--motion-fast, 120ms) var(--ease-standard, ease), color var(--motion-fast, 120ms) var(--ease-standard, ease); }
.chip-sub { flex-direction: column; gap: 0; min-height: 56px; padding: 6px 4px; border-radius: 16px; }
.chip-main { font-weight: 700; }
.chip-sub .chip-main { font-size: 13px; }
.chip-small { font-size: 11px; font-weight: 500; opacity: .85; }
.chip:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
</style>
