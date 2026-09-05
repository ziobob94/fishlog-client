<template>
  <span class="field-info" ref="root">
    <button
      type="button"
      class="field-info-btn"
      @click.stop="toggle"
      :aria-expanded="open"
      :aria-label="t('common.fieldInfo')"
    >
      <Info :size="13" />
    </button>
    <span v-if="open" class="field-info-popover" role="tooltip">{{ text }}</span>
  </span>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Info } from 'lucide-vue-next'

const { t } = useI18n()
defineProps({
  text: { type: String, required: true }
})

const open = ref(false)
const root = ref(null)
let closeTimer = null

function clearCloseTimer() {
  clearTimeout(closeTimer)
  closeTimer = null
}

function toggle() {
  open.value = !open.value
  clearCloseTimer()
  if (open.value) closeTimer = setTimeout(() => { open.value = false }, 4000)
}

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) {
    open.value = false
    clearCloseTimer()
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  clearCloseTimer()
})
</script>

<style scoped>
.field-info {
  display: inline-flex;
  position: relative;
  margin-left: .3rem;
  vertical-align: middle;
}

.field-info-btn {
  align-items: center;
  background: none;
  border: none;
  color: var(--text-muted, #6b8fa8);
  cursor: pointer;
  display: inline-flex;
  padding: 0;
  transition: color .15s;
}
.field-info-btn:hover,
.field-info-btn[aria-expanded="true"] {
  color: var(--ocean, #0ea5e9);
}

.field-info-popover {
  background: var(--surface, #0a1929);
  border: 1px solid var(--border, #2a3f55);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .35);
  color: var(--foam, #cde);
  font-size: .76rem;
  font-weight: 400;
  left: 0;
  letter-spacing: 0;
  line-height: 1.4;
  padding: .6rem .7rem;
  position: absolute;
  text-transform: none;
  top: 130%;
  width: max-content;
  max-width: 240px;
  z-index: 50;
}
</style>
