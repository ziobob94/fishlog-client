<template>
  <component :is="to ? RouterLink : 'span'" :to="to || undefined" class="ua" :class="{ ring: hasStory, unseen: hasStory && unseen }"
    :style="{ '--ua-size': size + 'px' }" :aria-label="label">
    <span class="ua-img">
      <img v-if="user?.avatar" :src="user.avatar" alt="" loading="lazy" />
      <template v-else>{{ toInitials(user?.displayName || user?.email || '?') }}</template>
    </span>
  </component>
</template>

<script setup>
// Avatar unico con regola di tocco: con storia attiva apre la storia,
// altrimenti il profilo (il proprio → /board). La storia si ricava dalla fila
// storie già filtrata per il visualizzatore, quindi vale per ogni lista.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useStoryStore } from '../stores/stories.js'
import { toInitials } from '../utils/initials.js'

const props = defineProps({
  user: { type: Object, default: null },
  size: { type: Number, default: 36 },
  // true = tocco sempre sul profilo, senza anello (es. dentro la storia)
  profileOnly: { type: Boolean, default: false },
  label: { type: String, default: '' }
})
const auth = useAuthStore()
const stories = useStoryStore()

const id = computed(() => props.user?._id || props.user?.id)
const isMe = computed(() => !!id.value && String(id.value) === String(auth.user?._id || auth.user?.id))
const group = computed(() => (props.profileOnly || !id.value) ? null : stories.groups.find(g => String(g.author?._id) === String(id.value)))
const hasStory = computed(() => !!group.value)
const unseen = computed(() => group.value ? !group.value.seen : false)
const to = computed(() => {
  if (!id.value) return null
  if (hasStory.value) return `/stories/${id.value}`
  return isMe.value ? '/board' : `/users/${id.value}`
})
</script>

<style scoped>
.ua { display: inline-flex; flex: none; width: var(--ua-size); height: var(--ua-size); border-radius: 50%; padding: 0; box-sizing: border-box; text-decoration: none; position: relative; }
.ua::after { content: ''; position: absolute; inset: -6px; } /* area di tocco ≥ 44px */
.ua.ring { padding: 2px; border: 2px solid var(--border-light); }
.ua.ring.unseen { border-color: rgb(var(--color-sand-text)); }
.ua-img { width: 100%; height: 100%; border-radius: 50%; background: var(--ocean-glow); color: rgb(var(--color-ocean-text)); font-weight: 800; font-size: calc(var(--ua-size) * .34); display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--ocean); box-sizing: border-box; }
.ua-img img { width: 100%; height: 100%; object-fit: cover; }
</style>
