<template>
  <div class="notifs">
    <PageHeader :title="t('notifications.title')" back>
      <button v-if="store.unreadCount" type="button" class="link-btn" @click="store.markAllRead()">{{ t('notifications.markAllRead') }}</button>
    </PageHeader>

    <div v-if="store.loading && !store.items.length" class="state-center"><div class="spinner"></div></div>

    <div v-else-if="!store.items.length" class="state-center">
      <Bobber :size="56" />
      <p class="text-muted">{{ t('notifications.empty') }}</p>
    </div>

    <template v-else>
      <section v-for="g in groups" :key="g.key" class="group">
        <h2 class="group-label">{{ t(`notifications.groups.${g.key}`) }}</h2>
        <ul class="list">
          <li v-for="n in g.items" :key="n._id" class="row" :class="{ unread: !n.read }">
            <component :is="isLinked(n) ? 'RouterLink' : 'div'" :to="linkFor(n)" class="row-main" @click="onOpen(n)">
              <span class="avatar-wrap">
                <img v-if="n.actor?.avatar" :src="n.actor.avatar" class="avatar" alt="" />
                <span v-else class="avatar avatar-ph">{{ initials(n.actor) }}</span>
                <span class="type-badge" :class="`tb-${badge(n).tone}`"><AppIcon :name="badge(n).icon" :size="12" stroke="2.5" /></span>
              </span>
              <span class="text">
                <span class="msg"><strong>{{ name(n) }}</strong> {{ t(`notifications.messages.${n.type}`) }}<template v-if="n.type === 'post_comment' && n.data?.preview">: «{{ n.data.preview }}»</template></span>
                <span class="time text-muted">{{ timeAgo(n.createdAt) }}</span>
              </span>
              <span v-if="!n.read" class="dot" :aria-label="t('notifications.unread')"></span>
            </component>
            <div v-if="n.type === 'friend_request' && n.data?.requestId && !done[n._id]" class="actions">
              <button type="button" class="btn btn-primary btn-sm" @click="respond(n, true)">{{ t('friends.actions.accept') }}</button>
              <button type="button" class="btn btn-secondary btn-sm" @click="respond(n, false)">{{ t('friends.actions.decline') }}</button>
            </div>
            <p v-else-if="done[n._id]" class="done text-muted text-sm">{{ t(`notifications.${done[n._id]}`) }}</p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { toInitials } from '../utils/initials.js'
import PageHeader from '../components/PageHeader.vue'
import { computed, onMounted, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '../components/AppIcon.vue'
import Bobber from '../components/Bobber.vue'
import { useNotificationStore } from '../stores/notifications.js'
import { useFriendStore } from '../stores/friends.js'

const { t, locale } = useI18n()
const store = useNotificationStore()
const friends = useFriendStore()
const done = reactive({})

onMounted(() => store.fetchNotifications())

const groups = computed(() => {
  const fresh = store.items.filter(n => !n.read)
  const old = store.items.filter(n => n.read)
  return [{ key: 'new', items: fresh }, { key: 'earlier', items: old }].filter(g => g.items.length)
})

const BADGES = {
  friend_request: { icon: 'profilo', tone: 'ocean' },
  friend_accept:  { icon: 'profilo', tone: 'green' },
  chat_message:   { icon: 'community', tone: 'ocean' },
  post_comment:   { icon: 'community', tone: 'ocean' },
  post_like:      { icon: 'mi-piace', tone: 'sand' }
}
const badge = n => BADGES[n.type] || BADGES.chat_message
const name = n => n.actor?.displayName || n.actor?.email || ''
const initials = a => toInitials(a?.displayName || a?.email || '?')

function linkFor(n) {
  if (n.type === 'chat_message') {
    return n.data?.conversationType === 'group' ? `/chat/group/${n.data.conversationId}` : `/chat/${n.actor?._id || ''}`
  }
  if (n.type === 'post_like' || n.type === 'post_comment') return '/feed'
  return n.actor?._id ? `/users/${n.actor._id}` : '/friends'
}
// Richiesta di amicizia: i pulsanti decidono, la riga non è un link
const isLinked = n => n.type !== 'friend_request'

function onOpen(n) { if (!n.read) store.markRead(n._id) }

async function respond(n, accept) {
  try {
    if (accept) await friends.acceptRequest(n.data.requestId)
    else await friends.declineRequest(n.data.requestId)
    done[n._id] = accept ? 'accepted' : 'declined'
    // Il server elimina la notifica gestita: riallinea solo il badge.
    n.read = true
    store.fetchUnreadCount()
  } catch { /* resta con i pulsanti: l'utente può riprovare */ }
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
  if (diff < 3600) return rtf.format(-Math.max(1, Math.round(diff / 60)), 'minute')
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour')
  return rtf.format(-Math.round(diff / 86400), 'day')
}
</script>

<style scoped>
.notifs { @apply max-w-xl mx-auto; }
.head { @apply flex items-center justify-between gap-3 mb-4; }
.link-btn { @apply min-h-[44px] bg-transparent border-none text-ocean-text font-semibold text-sm cursor-pointer; }
.group-label { @apply text-xs font-bold uppercase text-muted mb-2 mt-4; letter-spacing: 0.14em; }
.list { @apply list-none flex flex-col border-y border-border/60; }
.row { @apply flex flex-col gap-2 py-3 px-1 border-b border-border/60 last:border-b-0; }
.row.unread { background: rgb(var(--color-surface) / 0.6); }
.row-main { @apply flex items-start gap-3 text-foam no-underline min-h-[44px]; }
.avatar-wrap { @apply relative shrink-0; }
.avatar { @apply w-12 h-12 rounded-full object-cover; }
.avatar-ph { @apply inline-flex items-center justify-center bg-surface-2 text-ocean-text font-bold text-sm; }
.type-badge { @apply absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-on-primary border-2 border-ink; }
.tb-ocean { @apply bg-ocean; }
.tb-sand { @apply bg-sand; }
.tb-green { @apply bg-success; }
.text { @apply flex flex-col gap-0.5 flex-1 min-w-0; }
.msg { @apply text-sm leading-snug; }
.time { @apply text-xs; }
.dot { @apply w-2.5 h-2.5 rounded-full bg-ocean shrink-0 mt-1.5; }
.actions { @apply flex gap-2 pl-[60px]; }
.done { @apply pl-[60px]; }
</style>
