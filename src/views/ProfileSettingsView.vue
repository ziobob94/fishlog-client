<template>
  <div class="ps">
    <PageHeader :title="t('profile.settings.title')" back compact />

    <form class="form" @submit.prevent="save">
      <div class="photo">
        <span class="avatar"><img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="" /><template v-else>{{ initials }}</template></span>
        <div>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png" class="hidden" @change="onPhoto" />
          <button type="button" class="fl-btn2 photo-btn" :disabled="uploading" @click="fileInput.click()"><Camera :size="18" /> {{ t('profile.settings.changePhoto') }}</button>
          <p class="fl-hint">{{ t('profile.settings.photoHint') }}</p>
          <p v-if="photoError" class="fl-error" role="alert">{{ photoError }}</p>
        </div>
      </div>

      <div>
        <label class="fl-lab" for="ps-name">{{ t('profile.settings.name') }}</label>
        <input id="ps-name" v-model="form.displayName" class="fl-inp" type="text" required autocomplete="name" />
      </div>

      <div>
        <label class="fl-lab" for="ps-user">{{ t('profile.settings.username') }}</label>
        <input id="ps-user" v-model="form.username" class="fl-inp" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" pattern="[a-zA-Z0-9._]{3,30}" :title="t('profile.settings.usernameFormat')" @input="onUsername" />
        <p class="fl-hint">{{ t('profile.settings.usernameHint') }}</p>
      </div>

      <div>
        <label class="fl-lab" for="ps-bio">{{ t('profile.settings.bio') }}</label>
        <textarea id="ps-bio" v-model="form.bio" class="fl-inp" rows="3" maxlength="150"></textarea>
        <p class="counter fl-mono">{{ form.bio.length }} / 150</p>
      </div>

      <div>
        <label class="fl-lab" for="ps-loc">{{ t('profile.settings.location') }}</label>
        <input id="ps-loc" v-model="form.location" class="fl-inp" type="text" autocomplete="address-level2" />
        <p class="fl-hint">{{ t('profile.settings.locationHint') }}</p>
      </div>

      <p v-if="error" class="fl-error" role="alert">{{ error }}</p>

      <div class="fl-bar">
        <button type="submit" class="fl-btn1" :disabled="saving">
          <span v-if="saving" class="m-spinner" style="width:15px;height:15px"></span>
          {{ saving ? t('profile.account.saving') : t('profile.settings.save') }}
        </button>
        <button type="button" class="link-btn" @click="router.back()">{{ t('common.cancel') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Camera } from 'lucide-vue-next'
import PageHeader from '../components/PageHeader.vue'
import { useAuthStore } from '../stores/auth.js'
import { toInitials } from '../utils/initials.js'
import { showError, clearError, focusFirstInvalid } from '../utils/formValidation.js'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  displayName: auth.user?.displayName || '',
  username: auth.user?.username || '',
  bio: auth.user?.bio || '',
  location: auth.user?.location?.name || ''
})
const saving = ref(false)
const uploading = ref(false)
const error = ref('')
const photoError = ref('')
const fileInput = ref(null)
const initials = computed(() => toInitials(form.displayName || auth.user?.email || '?'))

function onUsername(e) { form.username = form.username.toLowerCase(); clearError(e.target) }

async function onPhoto(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  photoError.value = ''
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { photoError.value = t('profile.settings.photoTooBig'); return }
  uploading.value = true
  try { await auth.uploadAvatar(file) } catch (err) { photoError.value = err.response?.data?.error || t('common.error') } finally { uploading.value = false }
}

// Coordinate della zona (facoltative): ricerca best-effort del luogo scritto
async function geocode(name) {
  if (!name) return {}
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(name)}`, { headers: { 'Accept-Language': 'it' } })
    const [hit] = await r.json()
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : {}
  } catch { return {} }
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    const name = form.location.trim()
    const prev = auth.user?.location
    const coords = name && name === prev?.name && prev.lat != null ? { lat: prev.lat, lng: prev.lng } : await geocode(name)
    await auth.updateProfile({ displayName: form.displayName.trim(), username: form.username.trim(), bio: form.bio, location: { name, ...coords } })
    router.replace('/board')
  } catch (e) {
    const msg = e.response?.data?.error || t('common.error')
    if (e.response?.status === 409 || /nome utente/i.test(msg)) {
      const el = document.getElementById('ps-user')
      showError(el, msg); focusFirstInvalid(el.closest('form'))
    } else error.value = msg
  } finally { saving.value = false }
}
</script>

<style scoped>
.ps { max-width: 560px; }
.form { display: flex; flex-direction: column; gap: 20px; padding: 4px 0 calc(130px + env(safe-area-inset-bottom)); }
.photo { display: flex; align-items: center; gap: 16px; }
.avatar { width: 84px; height: 84px; border-radius: 50%; flex: none; background: var(--ocean-glow); border: 1px solid var(--ocean); color: rgb(var(--color-ocean-text)); font-weight: 800; font-size: 24px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.photo-btn { width: auto; padding: 0 16px; }
.counter { text-align: right; margin: 6px 0 0; font-size: 12px; color: var(--text-muted); }
.link-btn { background: none; border: none; color: rgb(var(--color-ocean-text)); cursor: pointer; font-weight: 700; font-size: 15px; min-height: 36px; }
.fl-bar { align-items: stretch; }
</style>
