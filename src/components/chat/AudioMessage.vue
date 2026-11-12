<template>
  <div class="audio-msg">
    <button type="button" class="audio-play" :aria-label="playing ? 'Pausa' : 'Riproduci'" @click="toggle">
      <Pause v-if="playing" :size="18" fill="currentColor" />
      <Play v-else :size="18" fill="currentColor" />
    </button>
    <div class="audio-wave" aria-hidden="true">
      <span v-for="(h, i) in bars" :key="i" :class="{ played: i / bars.length < progress }" :style="{ height: h + 'px' }"></span>
    </div>
    <audio ref="el" :src="src" preload="metadata" playsinline @loadedmetadata="onMeta" @durationchange="onMeta" @timeupdate="onTime" @play="playing = true" @pause="playing = false" @ended="onEnded"></audio>
    <span class="audio-time">{{ fmt(playing || current ? current : duration) }}</span>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { Play, Pause } from 'lucide-vue-next'

  const props = defineProps({ src: { type: String, default: '' }, seed: { type: String, default: '' } })

  const el = ref(null)
  const playing = ref(false)
  const duration = ref(0)
  const current = ref(0)
  const progress = computed(() => (duration.value ? current.value / duration.value : 0))

  // Forma d'onda decorativa ma stabile: derivata dall'id del messaggio.
  const bars = computed(() => {
    let h = 7
    for (const c of props.seed || 'x') h = (h * 31 + c.charCodeAt(0)) >>> 0
    return Array.from({ length: 20 }, () => {
      h = (h * 1664525 + 1013904223) >>> 0
      return 6 + (h % 18)
    })
  })

  // Lo stato `playing` segue gli eventi reali dell'elemento (play/pause), non il tocco:
  // su iOS/Safari il primo play() può fallire o ritardare e lo stato ottimistico
  // faceva sembrare l'audio "avviato" costringendo a un secondo tocco.
  async function toggle() {
    const a = el.value
    if (!a) return
    if (!a.paused) { a.pause(); return }
    try {
      await a.play()
    } catch {
      // Primo tentativo rifiutato (risorsa non ancora pronta): ricarica e riprova nel contesto del gesto.
      try { a.load(); await a.play() } catch { playing.value = false }
    }
  }
  function onMeta() { if (el.value && isFinite(el.value.duration)) duration.value = el.value.duration }
  function onTime() { current.value = el.value.currentTime }
  function onEnded() { playing.value = false; current.value = 0 }
  function fmt(s) {
    s = Math.round(s || 0)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }
</script>

<style scoped>
  .audio-msg { @apply grid items-center gap-x-2 gap-y-0; grid-template-columns: auto 1fr; min-width: 160px; }
  .audio-play { @apply flex items-center justify-center w-9 h-9 rounded-full bg-ocean text-on-primary border-none cursor-pointer; }
  .audio-wave { @apply flex items-center gap-[2px] h-7; }
  .audio-wave span { @apply w-[2px] rounded-full bg-ocean-text/50; }
  .audio-wave span.played { @apply bg-ocean-text; }
  .audio-time { @apply font-mono text-[0.7rem] text-muted; grid-column: 1; }
</style>
