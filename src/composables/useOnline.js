// Stato della connessione come ref reattivo (navigator.onLine + eventi online/offline).
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useOnline() {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  const on = () => { online.value = true }
  const off = () => { online.value = false }
  onMounted(() => { online.value = navigator.onLine; window.addEventListener('online', on); window.addEventListener('offline', off) })
  onBeforeUnmount(() => { window.removeEventListener('online', on); window.removeEventListener('offline', off) })
  return online
}
