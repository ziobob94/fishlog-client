<template>
  <div class="audio-msg">
    <button type="button" class="audio-play" :aria-label="playing ? 'Pausa' : 'Riproduci'" @click="toggle">
      <Pause v-if="playing" :size="18" fill="currentColor" />
      <Play v-else :size="18" fill="currentColor" />
    </button>
    <div
      ref="wave"
      class="audio-wave"
      role="slider"
      aria-label="Posizione"
      :aria-valuemin="0"
      :aria-valuemax="Math.round(duration)"
      :aria-valuenow="Math.round(current)"
      @pointerdown="onSeekStart"
      @pointermove="onSeekMove"
      @pointerup="onSeekEnd"
      @pointercancel="onSeekEnd"
    >
      <span v-for="(h, i) in bars" :key="i" :class="{ played: i / bars.length < progress }" :style="{ height: h + 'px' }"></span>
    </div>
    <audio ref="el" :src="src" preload="metadata" playsinline @loadedmetadata="onMeta" @durationchange="onMeta" @timeupdate="onTime" @play="onPlay" @pause="playing = false" @ended="onEnded"></audio>
    <span class="audio-time">{{ fmt(playing || current ? current : duration) }}</span>
    <div class="audio-tools">
      <button type="button" class="audio-chip" aria-label="Velocità di riproduzione" @click="cycleRate">{{ rateLabel }}</button>
      <button type="button" class="audio-chip" aria-label="Scarica vocale" :disabled="downloading" @click="download">
        <Download :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { Play, Pause, Download } from 'lucide-vue-next'

  const props = defineProps({ src: { type: String, default: '' }, seed: { type: String, default: '' } })

  const el = ref(null)
  const wave = ref(null)
  const rate = ref(1)
  const downloading = ref(false)
  let seeking = false
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
      a.playbackRate = rate.value
    } catch {
      // Primo tentativo rifiutato (risorsa non ancora pronta): ricarica e riprova nel contesto del gesto.
      try { a.load(); await a.play() } catch { playing.value = false }
    }
  }
  function onMeta() {
    const a = el.value
    if (!a) return
    if (isFinite(a.duration)) { duration.value = a.duration; return }
    // Registrazioni MediaRecorder (webm): durata Infinity finché non si forza la lettura fino in fondo.
    const fix = () => { a.removeEventListener('timeupdate', fix); a.currentTime = 0; onMeta() }
    a.addEventListener('timeupdate', fix)
    a.currentTime = 1e101
  }

  const rateLabel = computed(() => `x${String(rate.value).replace('.', ',')}`)
  function cycleRate() {
    rate.value = rate.value === 1 ? 1.5 : rate.value === 1.5 ? 2 : 1
    if (el.value) el.value.playbackRate = rate.value
  }

  function seekTo(e) {
    const a = el.value
    const box = wave.value?.getBoundingClientRect()
    if (!a || !box || !duration.value) return
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
    a.currentTime = ratio * duration.value
    current.value = a.currentTime
  }
  function onSeekStart(e) { seeking = true; wave.value?.setPointerCapture?.(e.pointerId); seekTo(e) }
  function onSeekMove(e) { if (seeking) seekTo(e) }
  function onSeekEnd() { seeking = false }

  async function download() {
    if (!props.src || downloading.value) return
    downloading.value = true
    try {
      const blob = await (await fetch(props.src)).blob()
      const ext = (blob.type.split('/')[1] || 'webm').split(';')[0].replace('mpeg', 'mp3').replace('x-m4a', 'm4a')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `vocale-${props.seed || Date.now()}.${ext}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch {
      window.open(props.src, '_blank')
    } finally {
      downloading.value = false
    }
  }
  function onTime() { current.value = el.value.currentTime }
  function onPlay() { playing.value = true; if (el.value) el.value.playbackRate = rate.value }
  function onEnded() { playing.value = false; current.value = 0 }
  // iOS azzera playbackRate al cambio di sorgente/load: riapplica a ogni play.
  function fmt(s) {
    s = Math.round(s || 0)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }
</script>

<style scoped>
  .audio-msg { @apply grid items-center gap-x-2 gap-y-0; grid-template-columns: auto 1fr; min-width: 160px; }
  .audio-play { @apply flex items-center justify-center w-9 h-9 rounded-full bg-ocean text-on-primary border-none cursor-pointer; }
  .audio-wave { @apply flex items-center gap-[2px] h-7 cursor-pointer; touch-action: none; }
  .audio-wave span { @apply w-[2px] rounded-full bg-ocean-text/50; }
  .audio-wave span.played { @apply bg-ocean-text; }
  .audio-time { @apply font-mono text-[0.7rem] text-muted; grid-column: 1; }
  .audio-tools { @apply flex items-center gap-1 justify-end; grid-column: 2; }
  .audio-chip { @apply flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-full bg-black/10 text-ocean-text border-none text-[0.7rem] font-mono cursor-pointer disabled:opacity-50; }
</style>