<template>
  <div class="rating">
    <div class="stars" role="radiogroup" :aria-label="label">
      <button v-for="n in 5" :key="n" type="button" class="star" :class="{ on: n <= modelValue }" role="radio"
        :aria-checked="modelValue === n" :aria-label="`${n} su 5 · ${words[n - 1]}`" :tabindex="tabIndexFor(n)"
        @click="emit('update:modelValue', modelValue === n ? 0 : n)" @keydown="onKey($event, n)">
        <Star :size="40" :fill="n <= modelValue ? 'currentColor' : 'none'" aria-hidden="true" />
      </button>
    </div>
    <p class="word" aria-live="polite"><strong>{{ modelValue ? words[modelValue - 1] : '' }}</strong><small>{{ modelValue ? `${modelValue} su 5` : '' }}</small></p>
  </div>
</template>

<script setup>
import { Star } from 'lucide-vue-next'

const props = defineProps({ modelValue: { type: Number, default: 0 }, words: { type: Array, required: true }, label: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const tabIndexFor = n => ((props.modelValue || 1) === n ? 0 : -1)
function onKey(e, n) {
  const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]
  if (!step) return
  e.preventDefault()
  const next = Math.min(5, Math.max(1, n + step))
  emit('update:modelValue', next)
  e.currentTarget.parentElement.querySelectorAll('[role="radio"]')[next - 1]?.focus()
}
</script>

<style scoped>
.rating { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.stars { display: flex; justify-content: center; gap: 4px; }
.star { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: none; border: 0; border-radius: 16px; color: var(--border-light); cursor: pointer; transition: color var(--motion-fast, 120ms) var(--ease-standard, ease), transform var(--motion-press, 80ms) var(--ease-standard, ease); }
.star.on { color: var(--sand); }
.star:active { transform: scale(.97); }
.star:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.word { display: flex; flex-direction: column; align-items: center; min-height: 44px; margin: 0; }
.word strong { font-size: 20px; font-weight: 800; color: var(--foam); }
.word small { color: var(--text-muted); font-size: 13px; }
</style>
