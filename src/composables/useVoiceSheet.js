import { ref } from 'vue'

// Stato condiviso del foglio «Cattura a voce»: lo aprono il pulsante flottante e la voce del «+».
const open = ref(false)
export function useVoiceSheet() {
  return { open, show: () => { open.value = true }, hide: () => { open.value = false } }
}
