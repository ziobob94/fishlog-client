<template>
  <component :is="to ? 'RouterLink' : 'div'" :to="to" class="sticker" :class="[sticker.kind, { link: !!to }]" @click.stop>
    <span v-if="sticker.kind === 'catch'" class="fl-mono eyebrow">{{ t('stories.hookLabel') }}</span>
    <span class="fl-mono label">{{ sticker.label }}</span>
    <span v-if="sticker.subtitle" class="fl-mono sub">{{ sticker.subtitle }}</span>
  </component>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
defineProps({ sticker: { type: Object, required: true }, to: { type: [String, Object], default: null } })
const { t } = useI18n()
</script>

<style scoped>
.sticker { display: inline-flex; flex-direction: column; gap: 2px; max-width: 86%; padding: 10px 16px 12px; border-radius: 18px 18px 18px 6px; text-decoration: none; transform: rotate(-4deg); box-shadow: 0 10px 26px rgba(0,0,0,.35); }
.sticker.catch { background: #f59e0b; color: #0b1623; }
.sticker.place, .sticker.water { background: rgba(11,22,35,.82); color: #fff; border: 1px solid rgba(255,255,255,.25); transform: rotate(2deg); }
.eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
.label { font-size: 22px; font-weight: 700; line-height: 1.15; letter-spacing: -.02em; }
.sticker.place .label, .sticker.water .label { font-size: 16px; }
.sub { font-size: 11px; opacity: .8; }
</style>
