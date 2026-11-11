// Ref reattivo che segue una media query (es. useMediaQuery('(min-width: 768px)')).
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useMediaQuery(query) {
  const matches = ref(typeof window !== 'undefined' && !!window.matchMedia?.(query).matches)
  let mq
  const on = e => { matches.value = e.matches }
  onMounted(() => { mq = window.matchMedia(query); matches.value = mq.matches; mq.addEventListener('change', on) })
  onBeforeUnmount(() => mq?.removeEventListener('change', on))
  return matches
}
