<template>
  <div v-if="error" class="error-banner"><AlertTriangle :size="16" /> {{ error }}</div>

  <div v-else class="thread">
    <div ref="scrollEl" class="messages-list">
      <div v-if="chatStore.loading && !chatStore.messages.length" class="state-center"><div class="spinner"></div></div>

      <template v-for="(m, i) in chatStore.messages" :key="m._id">
        <div v-if="showDateSeparator(m, i)" class="date-separator"><span>{{ formatDateSeparator(m.createdAt) }}</span></div>

        <div
          class="message-row"
          :class="{ mine: m.sender?._id === auth.user?._id }"
        >
          <div class="message-bubble" :class="{ deleted: m.deleted }">
            <span v-if="showSender(m)" class="message-sender">{{ m.sender?.displayName || m.sender?.email }}</span>

            <span v-if="m.deleted" class="message-text message-deleted-text">
              <Ban :size="14" /> {{ t('chat.deletedMessage') }}
            </span>

            <template v-else>
              <span v-if="!m.type || m.type === 'text'" class="message-text">{{ m.body }}</span>

              <a v-else-if="m.type === 'image'" :href="m.media?.url" target="_blank" rel="noopener">
                <img :src="m.media?.url" class="message-media-image" />
              </a>

              <video v-else-if="m.type === 'video'" :src="m.media?.url" controls class="message-media-video"></video>

              <audio v-else-if="m.type === 'audio'" :src="m.media?.url" controls class="message-audio"></audio>

              <a v-else-if="m.type === 'file'" :href="m.media?.url" target="_blank" rel="noopener" class="message-file">
                <FileText :size="20" />
                <span class="message-file-info">
                  <span class="message-file-name">{{ m.media?.originalName }}</span>
                  <span class="message-file-size">{{ formatSize(m.media?.size) }}</span>
                </span>
              </a>

              <a v-else-if="m.type === 'location'" :href="mapsLink(m.location)" target="_blank" rel="noopener" class="message-location">
                <MapDisplay class="message-location-map" :lat="m.location.lat" :lng="m.location.lng" />
                <span class="message-location-link"><MapPin :size="14" /> {{ t('chat.attach.openMaps') }}</span>
              </a>
            </template>

            <span class="message-meta">
              <span v-if="m.editedAt && !m.deleted" class="message-edited">{{ t('chat.edited') }}</span>
              {{ formatTime(m.createdAt) }}
              <template v-if="m.sender?._id === auth.user?._id">
                <Check v-if="!m.readBy?.length" :size="14" class="tick" />
                <CheckCheck v-else :size="14" class="tick tick-read" />
              </template>
            </span>
          </div>

          <div v-if="!m.deleted && m.sender?._id === auth.user?._id" class="message-actions">
            <button v-if="m.type === 'text'" class="message-action-btn" :title="t('chat.edit')" @click="startEdit(m)">
              <Pencil :size="13" />
            </button>
            <button class="message-action-btn" :title="t('chat.delete')" @click="removeMessage(m._id)">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="editingId" class="editing-banner">
      <Pencil :size="14" /> {{ t('chat.editing') }}
      <button class="icon-btn icon-btn-sm" type="button" @click="cancelEdit"><X :size="14" /></button>
    </div>

    <div class="message-input-row" ref="attachWrapper">
      <div v-if="!editingId" class="attach-wrap">
        <button class="icon-btn" type="button" :title="t('chat.attach.label')" @click="attachMenuOpen = !attachMenuOpen">
          <Paperclip :size="18" />
        </button>
        <div v-if="attachMenuOpen" class="attach-menu">
          <button type="button" @click="triggerMediaInput">{{ t('chat.attach.media') }}</button>
          <button type="button" @click="triggerFileInput">{{ t('chat.attach.file') }}</button>
          <button type="button" @click="shareLocation">{{ t('chat.attach.location') }}</button>
        </div>
        <input ref="mediaInputEl" type="file" accept="image/*,video/*" class="hidden-input" @change="onFileChosen" />
        <input ref="fileInputEl" type="file" class="hidden-input" @change="onFileChosen" />
      </div>

      <template v-if="recording">
        <div class="recording-indicator"><span class="rec-dot"></span> {{ formatElapsed(elapsedSeconds) }}</div>
        <button class="btn btn-ghost btn-sm" type="button" @click="cancelVoice">{{ t('common.cancel') }}</button>
        <button class="btn btn-primary btn-sm" type="button" @click="stopAndSendVoice">{{ t('chat.send') }}</button>
      </template>
      <template v-else>
        <input
          v-model="draft"
          type="text"
          :placeholder="t('chat.messagePlaceholder')"
          @keydown.enter="send"
        />
        <button v-if="draft.trim() || editingId" class="btn btn-primary btn-sm" type="button" :disabled="!draft.trim()" @click="send">{{ t('chat.send') }}</button>
        <button v-else class="icon-btn" type="button" :title="t('chat.attach.voice')" @click="startVoice">
          <Mic :size="18" />
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { AlertTriangle, Paperclip, Mic, MapPin, FileText, Check, CheckCheck, Pencil, Trash2, Ban, X } from 'lucide-vue-next'
  import { useChatStore } from '../../stores/chat.js'
  import { useAuthStore } from '../../stores/auth.js'
  import { useToast } from '../../composables/useToast.js'
  import { useVoiceRecorder } from '../../composables/useVoiceRecorder.js'
  import MapDisplay from '../MapDisplay.vue'

  // Vista di un thread singolo (diretto o di gruppo): riceve l'id della
  // conversazione già risolto e gestisce da sé cronologia, invio, allegati
  // e polling. Usata sia da ChatView (chat 1:1) sia da GroupChatView.
  const props = defineProps({
    conversationId: { type: String, required: true },
    // Nei gruppi mostriamo il nome del mittente sopra ogni messaggio altrui,
    // per distinguere chi ha scritto cosa; nelle chat dirette è superfluo.
    showSenderNames: { type: Boolean, default: false }
  })

  const { t } = useI18n()
  const chatStore = useChatStore()
  const auth = useAuthStore()
  const { toast } = useToast()

  const error = ref('')
  const draft = ref('')
  const scrollEl = ref(null)
  const editingId = ref(null)
  let pollTimer = null

  function showSender(m) {
    return props.showSenderNames && !m.deleted && m.sender?._id !== auth.user?._id
  }

  function startEdit(m) {
    editingId.value = m._id
    draft.value = m.body || ''
  }

  function cancelEdit() {
    editingId.value = null
    draft.value = ''
  }

  async function removeMessage(messageId) {
    if (!window.confirm(t('chat.confirmDelete'))) return
    await chatStore.deleteMessage(messageId)
  }

  // Allegati: menu "+" (media/file/posizione) e registrazione vocale
  const attachMenuOpen = ref(false)
  const attachWrapper = ref(null)
  const mediaInputEl = ref(null)
  const fileInputEl = ref(null)
  const { recording, elapsedSeconds, start: startRecording, stop: stopRecording, cancel: cancelRecording } = useVoiceRecorder()

  function closeAttachMenuOnOutsideClick(event) {
    if (attachMenuOpen.value && attachWrapper.value && !attachWrapper.value.contains(event.target)) {
      attachMenuOpen.value = false
    }
  }

  function triggerMediaInput() { attachMenuOpen.value = false; mediaInputEl.value?.click() }
  function triggerFileInput() { attachMenuOpen.value = false; fileInputEl.value?.click() }

  async function onFileChosen(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await chatStore.sendMedia(props.conversationId, file)
    await scrollToBottom()
  }

  function shareLocation() {
    attachMenuOpen.value = false
    if (!navigator.geolocation) { toast(t('chat.attach.locationUnsupported'), { type: 'danger' }); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await chatStore.sendLocation(props.conversationId, { lat: pos.coords.latitude, lng: pos.coords.longitude })
        await scrollToBottom()
      },
      () => toast(t('chat.attach.locationDenied'), { type: 'danger' })
    )
  }

  async function startVoice() {
    try {
      await startRecording()
    } catch (e) {
      const key = e?.name === 'NotAllowedError' ? 'chat.attach.micDenied' : 'chat.attach.micUnsupported'
      toast(t(key), { type: 'danger' })
    }
  }

  async function stopAndSendVoice() {
    const blob = await stopRecording()
    if (!blob) { toast(t('chat.attach.voiceEmpty'), { type: 'danger' }); return }
    // L'estensione riflette il mimetype reale negoziato dal browser (webm su
    // Chrome/Firefox, mp4 su Safari): forzarla a .webm su file non-webm rende
    // il file illeggibile ai player (durata 0 / errore di riproduzione).
    const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'
    const file = new File([blob], `vocale-${Date.now()}.${ext}`, { type: blob.type })
    await chatStore.sendMedia(props.conversationId, file)
    await scrollToBottom()
  }

  function cancelVoice() { cancelRecording() }

  function formatElapsed(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function isSameDay(a, b) {
    const d1 = new Date(a)
    const d2 = new Date(b)
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
  }

  // Separatore di giornata prima del primo messaggio e ad ogni cambio di
  // giorno, come nelle app di messaggistica più comuni.
  function showDateSeparator(m, i) {
    if (i === 0) return true
    return !isSameDay(m.createdAt, chatStore.messages[i - 1].createdAt)
  }

  function formatDateSeparator(date) {
    const d = new Date(date)
    const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
    const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000)

    if (diffDays === 0) return t('chat.today')
    if (diffDays === 1) return t('chat.yesterday')
    if (diffDays < 7) return d.toLocaleDateString('it-IT', { weekday: 'long' })
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
  }

  function formatSize(bytes) {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let n = bytes, i = 0
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(i > 0 && n < 10 ? 1 : 0)} ${units[i]}`
  }

  function mapsLink(loc) {
    return `https://maps.google.com/?q=${loc.lat},${loc.lng}`
  }

  async function scrollToBottom() {
    await nextTick()
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  }

  async function loadThread(conversationId) {
    error.value = ''
    try {
      await chatStore.fetchMessages(conversationId)
      await chatStore.markRead(conversationId)
      await chatStore.fetchUnreadCount()
      await scrollToBottom()
      clearInterval(pollTimer)
      pollTimer = setInterval(async () => {
        const before = chatStore.messages.length
        await chatStore.fetchMessages(conversationId)
        if (chatStore.messages.length > before) {
          await chatStore.markRead(conversationId)
          await chatStore.fetchUnreadCount()
          await scrollToBottom()
        }
      }, 4000)
    } catch (e) {
      error.value = e.response?.data?.error || t('common.error')
    }
  }

  async function send() {
    const body = draft.value.trim()
    if (!body) return
    draft.value = ''
    if (editingId.value) {
      const id = editingId.value
      editingId.value = null
      await chatStore.editMessage(id, body)
      return
    }
    await chatStore.sendMessage(props.conversationId, body)
    await scrollToBottom()
  }

  watch(() => props.conversationId, (id) => {
    clearInterval(pollTimer)
    chatStore.messages = []
    editingId.value = null
    if (id) loadThread(id)
  }, { immediate: true })

  onMounted(() => {
    document.addEventListener('click', closeAttachMenuOnOutsideClick)
  })

  onBeforeUnmount(() => {
    clearInterval(pollTimer)
    document.removeEventListener('click', closeAttachMenuOnOutsideClick)
  })
</script>

<style scoped>
  .error-banner {
    @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4 inline-flex items-center gap-2;
  }

  .thread {
    @apply flex flex-col gap-3 flex-1 min-h-0;
  }

  .messages-list {
    @apply flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-1;
  }

  .date-separator {
    @apply flex justify-center my-2;
  }

  .date-separator span {
    @apply text-[0.7rem] font-medium text-muted bg-surface-2 rounded-full px-2.5 py-1;
  }

  .message-row {
    @apply flex items-end gap-1;
  }

  /* row-reverse sposta i pulsanti azione a sinistra della bolla: da solo
     lascerebbe comunque il gruppo a sinistra dello schermo (il main-start
     di un row-reverse è a destra), quindi va allineato con justify-start,
     non flex-end, per finire davvero sul lato destro. */
  .message-row.mine {
    @apply justify-start flex-row-reverse;
  }

  .message-bubble {
    @apply max-w-[68%] min-w-[2.5rem] flex flex-col gap-0.5 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-sm text-foam;
  }

  .message-row.mine .message-bubble {
    @apply bg-ocean border-ocean text-white;
  }

  .message-sender {
    @apply text-xs font-semibold text-ocean;
  }

  .message-text {
    @apply whitespace-pre-wrap;
  }

  .message-bubble.deleted {
    @apply opacity-70 italic;
  }

  .message-deleted-text {
    @apply flex items-center gap-1.5 text-muted;
  }

  .message-row.mine .message-deleted-text {
    @apply text-white/70;
  }

  .message-meta {
    @apply self-end flex items-center gap-1 text-[0.65rem] opacity-90 mt-0.5 whitespace-nowrap;
  }

  .message-edited {
    @apply italic opacity-80;
  }

  .tick {
    @apply opacity-90;
  }

  .tick-read {
    @apply text-sky-300 opacity-100;
  }

  .message-actions {
    @apply flex flex-col gap-0.5 opacity-0 transition-opacity duration-150;
  }

  .message-row:hover .message-actions {
    @apply opacity-100;
  }

  .message-action-btn {
    @apply flex items-center justify-center w-6 h-6 rounded text-muted bg-transparent border-none cursor-pointer hover:bg-surface-2 hover:text-ocean transition-colors;
  }

  .message-media-image {
    @apply max-w-full rounded-sm max-h-72 object-cover cursor-pointer;
  }

  .message-media-video {
    @apply max-w-full rounded-sm max-h-72;
  }

  .message-audio {
    @apply max-w-full;
  }

  .message-file {
    @apply flex items-center gap-2 no-underline text-inherit bg-black/10 rounded-sm px-2 py-1.5;
  }

  .message-file-info {
    @apply flex flex-col min-w-0;
  }

  .message-file-name {
    @apply text-sm font-medium truncate max-w-[180px];
  }

  .message-file-size {
    @apply text-xs opacity-70;
  }

  .message-location {
    @apply flex flex-col gap-1 no-underline text-inherit;
  }

  .message-location-map :deep(.map-display) {
    height: 140px;
    width: 220px;
  }

  .message-location-link {
    @apply flex items-center gap-1 text-xs;
  }

  .editing-banner {
    @apply flex items-center gap-2 text-xs text-ocean bg-ocean/10 border-l-2 border-ocean px-3 py-1.5 rounded-sm;
  }

  .editing-banner .icon-btn-sm {
    @apply ml-auto;
  }

  .message-input-row {
    @apply flex items-center gap-2 border-t border-border pt-3 relative shrink-0;
  }

  .message-input-row input {
    @apply text-sm flex-1;
  }

  .icon-btn {
    @apply flex items-center justify-center w-9 h-9 rounded-lg text-muted bg-transparent border-none cursor-pointer hover:bg-surface-2 hover:text-ocean transition-colors shrink-0;
  }

  .icon-btn-sm {
    @apply w-6 h-6;
  }

  .hidden-input {
    @apply hidden;
  }

  .attach-wrap {
    @apply relative;
  }

  .attach-menu {
    @apply absolute bottom-11 left-0 flex flex-col gap-0.5 bg-surface border border-border rounded-lg p-1 z-10 min-w-[160px] shadow-lg;
  }

  .attach-menu button {
    @apply text-left text-sm px-3 py-2 rounded bg-transparent border-none text-foam cursor-pointer hover:bg-surface-2 transition-colors;
  }

  .recording-indicator {
    @apply flex items-center gap-2 text-sm text-danger flex-1;
  }

  .rec-dot {
    @apply w-2.5 h-2.5 rounded-full bg-danger animate-pulse;
  }
</style>
