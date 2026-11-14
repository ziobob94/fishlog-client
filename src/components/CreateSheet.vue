<template>
  <BottomSheet :model-value="open" :label="t('createMenu.sheetTitle')" @update:model-value="v => { if (!v) $emit('close') }">
    <div class="sheet-inner">
        <div class="sheet-head">
          <h2>{{ t('createMenu.sheetTitle') }}</h2>
          <button type="button" class="sheet-x" :aria-label="t('createMenu.close')" @click="$emit('close')"><X :size="22" /></button>
        </div>
        <component :is="o.to ? RouterLink : 'button'" v-for="o in options" :key="o.key" v-bind="o.to ? { to: o.to } : { type: 'button' }" class="opt" @click="onPick(o)">
          <span class="ic" :class="o.tone"><component :is="o.icon" :size="24" /></span>
          <span class="tx"><strong>{{ o.title }}</strong><small>{{ o.sub }}</small></span>
          <ChevronRight :size="20" class="go" />
        </component>
    </div>
  </BottomSheet>
</template>

<script setup>
import BottomSheet from './motion/BottomSheet.vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, ChevronRight, Image as ImageIcon, Fish, FileText, Camera, CalendarDays } from 'lucide-vue-next'
import { h } from 'vue'
import Fishy from './Fishy.vue'
// La riga «Fishy» ha il suo avatar al posto del microfono.
const FishyIcon = { render: () => h(Fishy, { size: 40, avatar: true }) }
import { useSessionStore } from '../stores/sessions.js'
import { useFishySheet } from '../composables/useFishySheet.js'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
const fishy = useFishySheet()
function onPick(o) { emit('close'); if (o.key === 'fishy') fishy.show() }

const { t } = useI18n()
const sessions = useSessionStore()
const route = useRoute()
// Da Il mio profilo, dopo la creazione si torna alla bacheca
const from = computed(() => route.path === '/board' ? { from: 'board' } : {})

// Foglio «Crea» (schermata 39): post, storia, uscita, annuncio.
const options = computed(() => [
  { key: 'post', tone: 'ocean', icon: ImageIcon, title: t('createMenu.post'), sub: t('createMenu.postSub'), to: { path: '/post/new', query: { ...from.value } } },
  { key: 'event', tone: 'ocean', icon: CalendarDays, title: t('createMenu.event'), sub: t('createMenu.eventSub'), to: { path: '/post/new', query: { type: 'event', ...from.value } } },
  { key: 'story', tone: 'sand', icon: Camera, title: t('createMenu.story'), sub: t('createMenu.storySub'), to: { path: '/story/new', query: { ...from.value } } },
  { key: 'session', tone: 'green', icon: Fish, title: t('createMenu.session'),
    sub: sessions.ongoing ? t('createMenu.resumeSession') : t('createMenu.sessionSub'),
    to: sessions.ongoing ? `/session/${sessions.ongoing._id}/edit` : '/new' },
  // Fishy, l'assistente vocale: sempre disponibile, anche senza un'uscita in corso (può avviarla lui).
  { key: 'fishy', tone: 'sand', icon: FishyIcon, title: t('createMenu.fishy'), sub: t('createMenu.fishySub') },
  { key: 'listing', tone: 'slate', icon: FileText, title: t('createMenu.listing'), sub: t('createMenu.listingSub'), to: '/market/new' }
])
</script>

<style scoped>
.sheet-inner { display: flex; flex-direction: column; gap: 12px; }
.sheet-head { display: flex; align-items: center; justify-content: space-between; margin: 6px 0 4px; }
.sheet-head h2 { font-size: 22px; font-weight: 800; margin: 0; color: var(--foam); }
.sheet-x { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: 0; color: var(--foam); cursor: pointer; }
.opt { display: flex; align-items: center; gap: 14px; min-height: 72px; padding: 12px 14px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 20px; text-decoration: none; color: var(--foam); }
button.opt { width: 100%; text-align: left; cursor: pointer; font: inherit; }
.ic { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex: none; }
.ic.ocean { background: rgba(14, 165, 233, .18); color: rgb(var(--color-ocean-text)); }
.ic.sand { background: rgba(251, 191, 36, .16); color: rgb(var(--color-sand-text)); }
.ic.green { background: rgba(74, 222, 128, .16); color: rgb(var(--color-success-text)); }
.ic.slate { background: rgba(148, 163, 184, .18); color: var(--foam); }
.tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.tx strong { font-size: 16px; font-weight: 700; }
.tx small { font-size: 13px; color: var(--text-muted); }
.go { color: var(--text-muted); flex: none; }
</style>
