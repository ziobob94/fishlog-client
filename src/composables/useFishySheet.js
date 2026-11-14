import { ref } from 'vue'

// Stato condiviso del foglio di Fishy: lo aprono il pulsante flottante e la voce del «+».
const open = ref(false)
export function useFishySheet() {
  return { open, show: () => { open.value = true }, hide: () => { open.value = false } }
}
