<template>
  <div class="comment-row" :class="{ 'is-reply': isReply }">
    <RouterLink v-if="c.user?._id" :to="`/users/${c.user._id}`" class="post-author-link">
      <img v-if="c.user?.avatar" :src="c.user.avatar" class="mini-avatar" alt="" />
      <span v-else class="mini-placeholder">{{ initials(c.user) }}</span>
    </RouterLink>
    <template v-else>
      <img v-if="c.user?.avatar" :src="c.user.avatar" class="mini-avatar" alt="" />
      <span v-else class="mini-placeholder">{{ initials(c.user) }}</span>
    </template>

    <div class="comment-body">
      <span class="text-sm">
        <RouterLink v-if="c.user?._id" :to="`/users/${c.user._id}`" class="comment-author"><strong>{{ c.user?.displayName || c.user?.email }}</strong></RouterLink>
        <strong v-else>{{ c.user?.displayName || c.user?.email }}</strong>
        <RouterLink v-if="c.replyTo?._id && isReply" :to="`/users/${c.replyTo._id}`" class="comment-mention">@{{ c.replyTo.displayName }}</RouterLink>
        <LinkifiedText :text="c.message" />
      </span>
      <span class="comment-meta text-muted">
        <span>{{ formatDate(c.createdAt) }}</span>
        <button type="button" class="comment-act" @click="$emit('reply', c)">{{ t('posts.comments.reply') }}</button>
      </span>
      <div v-if="reactionSummary.length" class="comment-reactions">
        <button
          v-for="r in reactionSummary" :key="r.emoji" type="button" class="reaction-chip"
          :class="{ mine: r.mine }" :aria-pressed="r.mine"
          :aria-label="t('posts.comments.reactWith', { emoji: r.emoji })"
          @click="$emit('react', c, r.emoji)"
        >{{ r.emoji }} <span class="font-mono">{{ r.count }}</span></button>
      </div>
      <div v-if="pickerOpen" class="reaction-picker" role="group" :aria-label="t('posts.comments.react')">
        <button v-for="e in EMOJIS" :key="e" type="button" class="picker-btn" :aria-label="t('posts.comments.reactWith', { emoji: e })" @click="pick(e)">{{ e }}</button>
      </div>
    </div>

    <div class="comment-side">
      <button
        type="button" class="side-btn" :class="{ liked: isLiked }" :aria-pressed="isLiked"
        :aria-label="t(isLiked ? 'posts.comments.unlike' : 'posts.comments.like')"
        @click="$emit('like', c)"
      >
        <Heart :size="18" :fill="isLiked ? 'currentColor' : 'none'" />
        <span v-if="c.likes?.length" class="font-mono like-count">{{ c.likes.length }}</span>
      </button>
      <button type="button" class="side-btn" :aria-expanded="pickerOpen" :aria-label="t('posts.comments.react')" @click="pickerOpen = !pickerOpen">
        <SmilePlus :size="18" />
      </button>
      <button v-if="canDelete" type="button" class="side-btn" :aria-label="t('posts.comments.delete')" @click="$emit('delete', c)">
        <X :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { Heart, SmilePlus, X } from 'lucide-vue-next'
import LinkifiedText from './LinkifiedText.vue'
import { useAuthStore } from '../../stores/auth.js'
import { toInitials } from '../../utils/initials.js'

const EMOJIS = ['👍', '❤️', '😂', '😮', '🎣']
const props = defineProps({
  c: { type: Object, required: true },
  isReply: Boolean,
  canDelete: Boolean,
  formatDate: { type: Function, required: true }
})
const emit = defineEmits(['reply', 'like', 'react', 'delete'])
const { t } = useI18n()
const auth = useAuthStore()
const pickerOpen = ref(false)

const me = computed(() => String(auth.user?._id || auth.user?.id || ''))
const isLiked = computed(() => (props.c.likes || []).some(id => String(id) === me.value))
const initials = u => toInitials(u?.displayName || u?.email || '?')
const reactionSummary = computed(() => {
  const map = new Map()
  for (const r of props.c.reactions || []) {
    const e = map.get(r.emoji) || { emoji: r.emoji, count: 0, mine: false }
    e.count++
    if (String(r.user) === me.value) e.mine = true
    map.set(r.emoji, e)
  }
  return [...map.values()]
})
function pick(e) { pickerOpen.value = false; emit('react', props.c, e) }
</script>

<style scoped>
.comment-row { @apply flex items-start gap-3 py-1; }
.comment-row.is-reply { @apply ml-12; }
/* Gli stili di .mini-avatar di PostCard sono scoped e non arrivano qui: tondo, cover, misura fissa */
.post-author-link { @apply flex shrink-0 rounded-full; }
.mini-avatar { @apply w-9 h-9 min-w-[2.25rem] rounded-full object-cover shrink-0; }
.mini-placeholder { @apply w-9 h-9 min-w-[2.25rem] rounded-full border border-ocean text-ocean-text flex items-center justify-center text-xs font-bold shrink-0; background: var(--ocean-glow); }
.comment-row.is-reply .mini-avatar, .comment-row.is-reply .mini-placeholder { @apply w-7 h-7 min-w-[1.75rem]; }
.comment-body { @apply flex flex-col gap-0.5 flex-1 min-w-0; }
.comment-author { @apply no-underline text-foam; }
.comment-mention { @apply no-underline text-ocean-text; }
.comment-meta { @apply flex items-center gap-1 text-xs; }
.comment-act { @apply min-h-[44px] min-w-[44px] px-2 -ml-2 bg-transparent border-none text-xs font-bold text-muted cursor-pointer; }
.comment-side { @apply flex items-center shrink-0; }
.side-btn { @apply inline-flex items-center justify-center gap-1 min-w-[44px] min-h-[44px] bg-transparent border-none text-muted cursor-pointer; }
.side-btn.liked { @apply text-sand-text; }
.like-count { @apply text-xs; min-width: 1ch; font-variant-numeric: tabular-nums; }
.comment-reactions, .reaction-picker { @apply flex flex-wrap gap-1.5; }
.reaction-chip { @apply min-h-[32px] px-2.5 rounded-full border border-border bg-transparent text-xs text-foam cursor-pointer; }
.reaction-chip.mine { @apply border-sand-text; }
.picker-btn { @apply min-w-[44px] min-h-[44px] rounded-full bg-transparent border border-border text-xl cursor-pointer; }
@media (prefers-reduced-motion: no-preference) {
  .reaction-picker { animation: pick-in 140ms ease-out; }
}
@keyframes pick-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
</style>
