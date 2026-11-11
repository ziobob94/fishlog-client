<template>
  <section class="ph">
    <div class="top">
      <RouterLink :to="own ? `/stories/${meId}` : '/story/new?from=board'" class="ring" :class="{ dashed: !own, seen: own?.seen }" :aria-label="own ? t('stories.yours') : t('stories.new')">
        <span class="avatar"><img v-if="user?.avatar" :src="user.avatar" alt="" /><template v-else>{{ initials }}</template></span>
        <span v-if="!own" class="plus" aria-hidden="true"><Plus :size="16" :stroke-width="2.6" /></span>
      </RouterLink>
      <nav class="stats" :aria-label="t('profileStats.label')">
        <RouterLink to="/sessions" class="stat m-press" :aria-label="t('profileStats.sessionsAria', { n: stats.sessionsCount })"><span class="fl-mono num">{{ stats.sessionsCount }}</span><span class="lbl">{{ t('profile.board.sessions') }}</span></RouterLink>
        <RouterLink :to="`/utenti/${meId}/catture`" class="stat m-press" :aria-label="t('profileStats.catchesAria', { n: stats.catchesCount })"><span class="fl-mono num">{{ stats.catchesCount }}</span><span class="lbl">{{ t('profile.board.catches') }}</span></RouterLink>
        <RouterLink to="/friends" class="stat m-press" :aria-label="t('profileStats.friendsAria', { n: stats.friendsCount })"><span class="fl-mono num">{{ stats.friendsCount }}</span><span class="lbl">{{ t('profile.board.friends') }}</span></RouterLink>
      </nav>
    </div>
    <p class="name">{{ user?.displayName || user?.username || user?.email }}</p>
    <p v-if="user?.bio" class="bio">{{ user.bio }}</p>
    <p v-if="user?.location?.name" class="loc"><MapPin :size="15" /> {{ user.location.name }}<span v-if="coords" class="fl-mono coords"> · {{ coords }}</span></p>
    <div class="actions">
      <RouterLink to="/profile/edit" class="fl-btn2 edit">{{ t('profile.board.edit') }}</RouterLink>
      <button type="button" class="fl-iconbtn" :aria-label="t('profile.board.share')" @click="share"><Share2 :size="20" /></button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, MapPin, Share2 } from 'lucide-vue-next'
import { toInitials } from '../../utils/initials.js'
import { useToast } from '../../composables/useToast.js'

const props = defineProps({
  user: { type: Object, default: null },
  own: { type: Object, default: null },        // gruppo storie proprio, se esiste
  stats: { type: Object, default: () => ({ sessionsCount: 0, catchesCount: 0, friendsCount: 0 }) }
})
const { t } = useI18n()
const { toast } = useToast()
const meId = computed(() => props.user?._id || props.user?.id)
const initials = computed(() => toInitials(props.user?.displayName || props.user?.email || '?'))
const coords = computed(() => {
  const l = props.user?.location
  if (l?.lat == null || l?.lng == null) return ''
  return `${Math.abs(l.lat).toFixed(2)}° ${l.lat >= 0 ? 'N' : 'S'} ${Math.abs(l.lng).toFixed(2)}° ${l.lng >= 0 ? 'E' : 'O'}`
})

async function share() {
  const url = `${location.origin}/users/${meId.value}`
  try {
    if (navigator.share) await navigator.share({ title: props.user?.displayName || 'FishLog', url })
    else { await navigator.clipboard.writeText(url); toast(t('profile.board.linkCopied'), { type: 'success' }) }
  } catch { /* annullato */ }
}
</script>

<style scoped>
.ph { padding: 4px 0 14px; }
.top { display: flex; align-items: center; gap: 22px; }
.ring { position: relative; flex: none; width: 88px; height: 88px; border-radius: 50%; padding: 4px; border: 3px solid rgb(var(--color-sand-text)); display: flex; box-sizing: border-box; text-decoration: none; }
.ring.seen { border-color: var(--border-light); }
.ring.dashed { border: 2px dashed var(--border-light); }
.avatar { width: 100%; height: 100%; border-radius: 50%; background: var(--ocean-glow); border: 1px solid var(--ocean); color: rgb(var(--color-ocean-text)); font-weight: 800; font-size: 22px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.plus { position: absolute; right: -2px; bottom: -2px; width: 26px; height: 26px; border-radius: 50%; background: var(--ocean); color: rgb(var(--color-on-primary)); border: 2px solid rgb(var(--color-ink)); display: flex; align-items: center; justify-content: center; }
.stats { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; }
.stat { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 56px; min-width: 52px; border-radius: 12px; text-decoration: none; }
.stat:active { background: var(--ocean-glow); }
.stat:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.num { font-size: 20px; color: var(--foam); line-height: 1.2; }
.lbl { font-size: 13px; color: var(--text-muted); }
.name { margin: 14px 0 0; font-size: 16px; font-weight: 800; color: var(--foam); }
.bio { margin: 4px 0 0; font-size: 15px; line-height: 1.4; color: var(--foam); white-space: pre-line; }
.loc { margin: 8px 0 0; display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }
.coords { font-size: 12px; }
.actions { display: flex; gap: 10px; margin-top: 14px; }
.edit { flex: 1; text-decoration: none; }
</style>
