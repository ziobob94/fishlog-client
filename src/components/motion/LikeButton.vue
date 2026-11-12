<template>
  <!-- Cuore: al «mi piace» il cuore fa un picco di scala (1 → 1,18 → 1, 320 ms, molla leggera) e un'onda gli si allarga attorno.
       Al «non mi piace» cambia solo colore (120 ms). Il numero è in mono e non sposta il layout (cifre tabulari, larghezza minima). -->
  <button class="like m-press" type="button" :aria-pressed="liked" :aria-label="liked ? 'Non mi piace più' : 'Mi piace'" @click="toggle">
    <span class="like-ic" :class="{ 'm-ripple': burst }" :style="{ color: liked ? 'rgb(var(--color-sand-text))' : 'inherit' }">
      <svg :class="{ 'm-pop': burst }" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"
           :style="{ fill: liked ? 'currentColor' : 'none', transition: 'fill var(--motion-fast) var(--ease-standard)' }">
        <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      </svg>
    </span>
    <span v-if="count != null" class="font-mono like-n">{{ count }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({ liked: Boolean, count: Number })
const emit = defineEmits(['toggle'])
const burst = ref(false)
function toggle() {
  emit('toggle')
  if (!props.liked) { burst.value = false; requestAnimationFrame(() => { burst.value = true; setTimeout(() => (burst.value = false), 340) }) }
}
</script>

<style scoped>
.like { min-width: 44px; min-height: 44px; padding: 0 6px 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 0; background: transparent; color: rgb(var(--color-foam)); font-size: 14px; font-weight: 600; }
.like-ic { position: relative; display: inline-flex; }
.like-n { min-width: 1ch; line-height: 1; font-variant-numeric: tabular-nums; }
</style>
