<template>
  <Teleport to="body">
    <div class="dialog-overlay" @click.self="$emit('close')" @keydown.esc="$emit('close')">
      <div class="dialog card" role="dialog" aria-modal="true" :aria-label="t('session.share.title')">
        <h3>{{ t('session.share.title') }}</h3>

        <template v-if="!url">
          <p class="text-muted mt-1">{{ t('session.share.intro') }}</p>
          <ul class="info-list">
            <li>{{ t('session.share.showsYes') }}</li>
            <li>{{ t('session.share.showsNo') }}</li>
          </ul>
          <p v-if="error" class="err" role="alert">{{ error }}</p>
          <div class="row">
            <button type="button" class="fl-btn2" @click="$emit('close')">{{ t('common.cancel') }}</button>
            <button type="button" class="fl-btn1" :disabled="busy" @click="create"><Link2 :size="18" /> {{ t('session.share.create') }}</button>
          </div>
        </template>

        <template v-else>
          <p class="text-muted mt-1">{{ t('session.share.active') }}</p>
          <input class="link-box fl-mono" readonly :value="url" :aria-label="t('session.share.linkLabel')" @focus="$event.target.select()" />
          <p v-if="error" class="err" role="alert">{{ error }}</p>
          <div class="row">
            <button type="button" class="fl-btn2" @click="copy"><Copy :size="18" /> {{ copied ? t('session.share.copied') : t('session.share.copy') }}</button>
            <button v-if="canNative" type="button" class="fl-btn1" @click="share"><Share2 :size="18" /> {{ t('session.share.share') }}</button>
          </div>
          <button type="button" class="revoke" :disabled="busy" @click="revoke"><LinkOff :size="18" /> {{ t('session.share.revoke') }}</button>
          <p class="hint">{{ t('session.share.revokeHint') }}</p>
          <button type="button" class="fl-btn2 mt-2" @click="$emit('close')">{{ t('session.share.close') }}</button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Link2, Copy, Share2, Link2Off as LinkOff } from 'lucide-vue-next'
import { sessionShareApi } from '../utils/sessionShare.js'
import { nativeShare, copyText } from '../utils/nativeShare.js'

const props = defineProps({ session: { type: Object, required: true } })
const emit = defineEmits(['close', 'changed'])
const { t } = useI18n()

const url = ref('')
const busy = ref(false)
const copied = ref(false)
const error = ref('')
const canNative = computed(() => typeof navigator !== 'undefined' && !!navigator.share)
const title = computed(() => props.session.title || props.session.location?.name || t('session.untitled'))

// Un'uscita già condivisa mostra subito il suo link (la POST è idempotente);
// una non condivisa aspetta il consenso esplicito dell'autore.
async function create() {
  busy.value = true; error.value = ''
  try {
    const r = await sessionShareApi.create(props.session._id)
    url.value = r.url
    emit('changed', r.shareToken)
  } catch (e) { error.value = e.response?.data?.error || t('common.error') }
  finally { busy.value = false }
}
async function revoke() {
  busy.value = true; error.value = ''
  try {
    await sessionShareApi.revoke(props.session._id)
    url.value = ''
    emit('changed', null)
  } catch (e) { error.value = e.response?.data?.error || t('common.error') }
  finally { busy.value = false }
}
async function copy() {
  if (await copyText(url.value)) { copied.value = true; setTimeout(() => (copied.value = false), 2000) }
}
async function share() {
  const r = await nativeShare({ title: title.value, text: t('session.share.text', { title: title.value }), url: url.value })
  if (r === 'unsupported') copy()
}
onMounted(() => { if (props.session.shareToken) create() })
</script>

<style scoped>
.dialog-overlay { @apply fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center; }
.dialog { @apply max-w-sm w-[90%]; display: flex; flex-direction: column; gap: 12px; }
.info-list { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 6px; font-size: 14px; color: var(--foam); }
.row { display: flex; gap: 10px; }
.row > * { flex: 1; }
.link-box { min-height: 48px; border-radius: 14px; border: 1px solid var(--border-light); background: var(--surface-2); color: var(--foam); padding: 0 12px; font-size: 13px; width: 100%; box-sizing: border-box; }
.revoke { min-height: 48px; border-radius: 14px; background: transparent; border: 1px solid #7f1d1d; color: rgb(var(--color-danger-text)); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
.hint { font-size: 13px; color: var(--text-muted); margin: 0; }
.err { color: rgb(var(--color-danger-text)); font-size: 14px; margin: 0; }
.fl-btn1:focus-visible, .fl-btn2:focus-visible, .revoke:focus-visible, .link-box:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
</style>
