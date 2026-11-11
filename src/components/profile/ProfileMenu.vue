<template>
  <Teleport to="body">
    <div v-if="open" class="sheet-backdrop" @click.self="$emit('close')">
      <div class="sheet" role="dialog" aria-modal="true" :aria-label="t('profile.menu.title')">
        <span class="grab" aria-hidden="true"></span>
        <div class="sheet-head">
          <h2>{{ t('profile.menu.title') }}</h2>
          <button type="button" class="sheet-x" :aria-label="t('createMenu.close')" @click="$emit('close')"><X :size="22" /></button>
        </div>
        <RouterLink v-for="o in options" :key="o.key" :to="o.to" class="opt" @click="$emit('close')">
          <span class="ic" :class="o.tone"><component :is="o.icon" :size="22" /></span>
          <span class="tx"><strong>{{ o.title }}</strong><small>{{ o.sub }}</small></span>
          <ChevronRight :size="20" class="go" />
        </RouterLink>
        <hr class="sep" />
        <button type="button" class="opt out" @click="logout">
          <span class="ic danger"><LogOut :size="22" /></span>
          <span class="tx"><strong>{{ t('profile.menu.logout') }}</strong><small>{{ t('profile.menu.logoutSub') }}</small></span>
          <ChevronRight :size="20" class="go" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, ChevronRight, User, Lock, Bell, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth.js'

defineProps({ open: { type: Boolean, default: false } })
defineEmits(['close'])

const { t } = useI18n()
const auth = useAuthStore()

// Menù del profilo (schermata 46)
const options = computed(() => [
  { key: 'edit', tone: 'ocean', icon: User, title: t('profile.menu.edit'), sub: t('profile.menu.editSub'), to: '/profile/edit' },
  { key: 'privacy', tone: 'ocean', icon: Lock, title: t('profile.menu.privacy'), sub: t('profile.menu.privacySub'), to: { path: '/profile', query: { section: 'privacy' } } },
  { key: 'notif', tone: 'sand', icon: Bell, title: t('profile.menu.notifications'), sub: t('profile.menu.notificationsSub'), to: { path: '/profile', query: { section: 'notifications' } } }
])

function logout() { auth.logout(); window.location.assign('/login') }
</script>

<style scoped>
.sheet-backdrop { position: fixed; inset: 0; z-index: 300; background: rgba(0, 0, 0, .55); display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: 100%; max-width: 560px; background: var(--surface); border: 1px solid var(--border); border-bottom: 0; border-radius: 28px 28px 0 0; padding: 10px 16px calc(24px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 12px; }
.grab { width: 40px; height: 4px; border-radius: 2px; background: var(--border-light); align-self: center; }
.sheet-head { display: flex; align-items: center; justify-content: space-between; margin: 6px 0 4px; }
.sheet-head h2 { font-size: 22px; font-weight: 800; margin: 0; color: var(--foam); }
.sheet-x { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: 0; color: var(--foam); cursor: pointer; }
.opt { display: flex; align-items: center; gap: 14px; min-height: 72px; padding: 12px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface-2); text-decoration: none; color: var(--foam); width: 100%; box-sizing: border-box; text-align: left; cursor: pointer; font: inherit; }
.ic { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex: none; background: var(--surface); }
.ic.ocean { color: rgb(var(--color-ocean-text)); }
.ic.sand { color: rgb(var(--color-sand-text)); }
.ic.danger { color: rgb(var(--color-danger-text)); }
.tx { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.tx strong { font-size: 16px; font-weight: 700; }
.tx small { font-size: 13px; color: var(--text-muted); }
.go { color: var(--text-muted); flex: none; }
.sep { border: 0; border-top: 1px solid var(--border); margin: 2px 0; }
.opt.out strong { color: rgb(var(--color-danger-text)); }
</style>
