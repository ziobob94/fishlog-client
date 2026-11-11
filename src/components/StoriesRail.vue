<template>
  <div class="rail" role="list" :aria-label="t('stories.rail')">
    <!-- La tua storia -->
    <RouterLink :to="own ? `/stories/${meId}` : '/story/new'" class="item" role="listitem" :aria-label="t('stories.yours')">
      <span class="ring" :class="{ dashed: !own, seen: own?.seen }">
        <span class="avatar"><img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="" /><template v-else>{{ initials }}</template></span>
        <RouterLink v-if="own" to="/story/new" class="plus" :aria-label="t('stories.new')" @click.stop><Plus :size="16" :stroke-width="2.6" /></RouterLink>
        <span v-else class="plus" aria-hidden="true"><Plus :size="16" :stroke-width="2.6" /></span>
      </span>
      <span class="name your">{{ t('stories.yours') }}</span>
    </RouterLink>

    <RouterLink v-for="g in others" :key="g.author._id" :to="`/stories/${g.author._id}`" class="item" role="listitem">
      <span class="ring" :class="{ seen: g.seen }">
        <span class="avatar"><img v-if="g.author.avatar" :src="g.author.avatar" alt="" /><template v-else>{{ toInitials(g.author.displayName || '?') }}</template></span>
      </span>
      <span class="name">{{ g.author.displayName }}</span>
    </RouterLink>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import { useStoryStore } from '../stores/stories.js'
import { toInitials } from '../utils/initials.js'

const { t } = useI18n()
const auth = useAuthStore()
const stories = useStoryStore()

const meId = computed(() => auth.user?._id || auth.user?.id)
const own = computed(() => stories.groups.find(g => g.own) || null)
const others = computed(() => stories.groups.filter(g => !g.own))
const initials = computed(() => toInitials(auth.user?.displayName || auth.user?.email || '?'))

onMounted(() => stories.fetchRail())
</script>

<style scoped>
.rail { display: flex; gap: 14px; overflow-x: auto; padding: 4px 2px 12px; margin-bottom: 4px; scrollbar-width: none; }
.rail::-webkit-scrollbar { display: none; }
.item { flex: none; width: 72px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none; color: var(--foam); min-height: 44px; }
.ring { position: relative; width: 68px; height: 68px; border-radius: 50%; padding: 3px; border: 3px solid rgb(var(--color-sand-text)); display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.ring.seen { border-color: var(--border-light); }
.ring.dashed { border: 2px dashed var(--border-light); }
.avatar { width: 100%; height: 100%; border-radius: 50%; background: var(--ocean-glow); color: rgb(var(--color-ocean-text)); font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.plus { position: absolute; right: -2px; bottom: -2px; width: 26px; height: 26px; border-radius: 50%; background: var(--ocean); color: rgb(var(--color-on-primary)); border: 3px solid var(--ink); display: flex; align-items: center; justify-content: center; text-decoration: none; }
.name { font-size: 12px; font-weight: 600; max-width: 72px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--foam); }
.name.your { color: rgb(var(--color-ocean-text)); font-weight: 700; }
</style>
