<template>
  <Teleport to="body">
    <div v-if="open" class="sheet-backdrop" @click.self="$emit('close')">
      <div class="sheet" role="dialog" aria-modal="true" :aria-label="t('createMenu.sheetTitle')">
        <span class="grab" aria-hidden="true"></span>
        <div class="sheet-head">
          <h2>{{ t('createMenu.sheetTitle') }}</h2>
          <button type="button" class="sheet-x" :aria-label="t('createMenu.close')" @click="$emit('close')"><X :size="22" /></button>
        </div>
        <RouterLink v-for="o in options" :key="o.key" :to="o.to" class="opt" @click="$emit('close')">
          <span class="ic" :class="o.tone"><component :is="o.icon" :size="24" /></span>
          <span class="tx"><strong>{{ o.title }}</strong><small>{{ o.sub }}</small></span>
          <ChevronRight :size="20" class="go" />
        </RouterLink>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, ChevronRight, Image as ImageIcon, Fish, FileText } from 'lucide-vue-next'
import { useSessionStore } from '../stores/sessions.js'

defineProps({ open: { type: Boolean, default: false } })
defineEmits(['close'])

const { t } = useI18n()
const sessions = useSessionStore()

// Foglio «Crea» (schermata 39): post, uscita, annuncio. La storia si aggiunge quando c'è il server.
const options = computed(() => [
  { key: 'post', tone: 'ocean', icon: ImageIcon, title: t('createMenu.post'), sub: t('createMenu.postSub'), to: { path: '/feed', query: { compose: '1' } } },
  { key: 'session', tone: 'green', icon: Fish, title: t('createMenu.session'),
    sub: sessions.ongoing ? t('createMenu.resumeSession') : t('createMenu.sessionSub'),
    to: sessions.ongoing ? `/session/${sessions.ongoing._id}/edit` : '/new' },
  { key: 'listing', tone: 'slate', icon: FileText, title: t('createMenu.listing'), sub: t('createMenu.listingSub'), to: '/market/new' }
])
</script>

<style scoped>
.sheet-backdrop { position: fixed; inset: 0; z-index: 300; background: rgba(0, 0, 0, .55); display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: 100%; max-width: 560px; background: var(--surface); border: 1px solid var(--border); border-bottom: 0; border-radius: 28px 28px 0 0; padding: 10px 16px calc(24px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 12px; }
.grab { width: 40px; height: 4px; border-radius: 2px; background: var(--border-light); align-self: center; }
.sheet-head { display: flex; align-items: center; justify-content: space-between; margin: 6px 0 4px; }
.sheet-head h2 { font-size: 22px; font-weight: 800; margin: 0; color: var(--foam); }
.sheet-x { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: 0; color: var(--foam); cursor: pointer; }
.opt { display: flex; align-items: center; gap: 14px; min-height: 72px; padding: 12px 14px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 20px; text-decoration: none; color: var(--foam); }
.ic { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex: none; }
.ic.ocean { background: rgba(14, 165, 233, .18); color: rgb(var(--color-ocean-text)); }
.ic.sand { background: rgba(251, 191, 36, .16); color: rgb(var(--color-sand-text)); }
.ic.green { background: rgba(74, 222, 128, .16); color: rgb(var(--color-success-text)); }
.ic.slate { background: rgba(148, 163, 184, .18); color: var(--foam); }
.tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.tx strong { font-family: var(--font-display); font-size: 18px; font-weight: 800; letter-spacing: -.01em; }
.tx small { font-size: 13px; color: var(--text-muted); }
.go { color: var(--text-muted); flex: none; }
</style>
