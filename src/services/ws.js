import { useAuthStore } from '../stores/auth.js'
import { useChatStore } from '../stores/chat.js'
import { useNotificationStore } from '../stores/notifications.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

let socket = null
let reconnectDelay = 1000
let reconnectTimer = null
let manuallyClosed = false

function wsUrl(token) {
  const url = new URL('/api/ws', API_BASE)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('token', token)
  return url.toString()
}

function handleMessage(event) {
  let message
  try { message = JSON.parse(event.data) } catch { return }

  if (message.type === 'notification') {
    useNotificationStore().applyRealtimeEvent(message.payload)
  } else if (message.type === 'chat:unread') {
    const chat = useChatStore()
    chat.setUnreadCount(message.count)
    // Aggiorna anteprima/non letti nella lista conversazioni se è già caricata
    // (es. utente sulla pagina /chat con un'altra chat aperta o sulla lista).
    if (chat.conversations.length) chat.fetchConversations()
  } else if (message.type === 'notifications:read') {
    useNotificationStore().markConversationRead(message.conversationId, message.count)
  } else if (message.type === 'chat:message-updated') {
    const chat = useChatStore()
    chat.applyUpdated(message.message)
    if (chat.conversations.length) chat.fetchConversations()
  } else if (message.type === 'chat:message-deleted') {
    const chat = useChatStore()
    chat.applyDeleted(message.messageId)
    if (chat.conversations.length) chat.fetchConversations()
  }
}

function scheduleReconnect() {
  if (manuallyClosed) return
  clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(connectWebSocket, reconnectDelay)
  reconnectDelay = Math.min(reconnectDelay * 2, 30000)
}

export function connectWebSocket() {
  const auth = useAuthStore()
  if (!auth.token) return

  manuallyClosed = false
  socket = new WebSocket(wsUrl(auth.token))

  socket.addEventListener('open', () => { reconnectDelay = 1000 })
  socket.addEventListener('message', handleMessage)
  socket.addEventListener('close', scheduleReconnect)
  socket.addEventListener('error', () => socket.close())
}

export function disconnectWebSocket() {
  manuallyClosed = true
  clearTimeout(reconnectTimer)
  socket?.close()
  socket = null
}
