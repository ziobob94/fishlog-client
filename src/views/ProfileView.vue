<template>
  <div>
    <div class="page-header">
      <h2>{{ t('profile.titlePrefix') }} <span class="text-ocean">{{ t('profile.titleHighlight') }}</span></h2>
    </div>

    <div class="profile-grid">
      <!-- Account -->
      <section class="card">
        <h3>{{ t('profile.account.title') }}</h3>
        <div class="avatar-row">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" class="avatar" />
          <span v-else class="avatar-placeholder">{{ initials }}</span>
          <div class="flex flex-col gap-1">
            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatarChange" />
            <button class="btn btn-secondary btn-sm" :disabled="uploadingAvatar" @click="fileInput.click()">
              {{ uploadingAvatar ? t('profile.account.uploading') : t('profile.account.changeAvatar') }}
            </button>
          </div>
        </div>

        <div class="form-group mt-3">
          <label>{{ t('profile.account.nameLabel') }}</label>
          <input v-model="displayName" type="text" />
        </div>
        <p v-if="accountError" class="error-msg mt-2">{{ accountError }}</p>
        <p v-if="accountSaved" class="success-msg mt-2">{{ t('common.save') }} ✓</p>
        <button class="btn btn-primary btn-sm mt-2" :disabled="savingAccount" @click="saveAccount">
          {{ savingAccount ? t('profile.account.saving') : t('common.save') }}
        </button>
      </section>

      <!-- Credenziali -->
      <section class="card">
        <h3>{{ t('profile.credentials.title') }}</h3>

        <p v-if="!features.passwordAuthEnabled" class="coming-soon mb-3">
          <span class="badge badge-sand">{{ t('home.hub.comingSoon') }}</span>
          {{ t('profile.credentials.disabled') }}
        </p>

        <div v-if="features.passwordAuthEnabled && auth.user?.hasPassword" class="credential-block">
          <h4>{{ t('profile.credentials.passwordTitle') }}</h4>
          <div class="form-group">
            <label>{{ t('profile.credentials.currentPassword') }}</label>
            <input v-model="pwForm.currentPassword" type="password" />
          </div>
          <div class="form-group mt-1">
            <label>{{ t('profile.credentials.newPassword') }}</label>
            <input v-model="pwForm.newPassword" type="password" />
          </div>
          <p v-if="pwError" class="error-msg mt-1">{{ pwError }}</p>
          <p v-if="pwSaved" class="success-msg mt-1">{{ t('profile.credentials.passwordUpdated') }}</p>
          <button class="btn btn-secondary btn-sm mt-2" :disabled="savingPw" @click="savePassword">
            {{ savingPw ? t('profile.account.saving') : t('profile.credentials.changePassword') }}
          </button>
        </div>
        <p v-else-if="features.passwordAuthEnabled" class="text-muted text-sm">{{ t('profile.credentials.oauthOnly') }}</p>

        <div v-if="features.passwordAuthEnabled" class="credential-block mt-3">
          <h4>{{ t('profile.credentials.emailTitle') }}</h4>
          <p v-if="auth.user?.pendingEmail" class="success-msg mb-2">
            {{ t('profile.credentials.pendingEmail', { email: auth.user.pendingEmail }) }}
          </p>
          <div class="form-group">
            <label>{{ t('profile.credentials.newEmail') }}</label>
            <input v-model="emailForm.newEmail" type="email" :placeholder="auth.user?.email" />
          </div>
          <div v-if="auth.user?.hasPassword" class="form-group mt-1">
            <label>{{ t('profile.credentials.currentPassword') }}</label>
            <input v-model="emailForm.currentPassword" type="password" />
          </div>
          <p v-if="emailError" class="error-msg mt-1">{{ emailError }}</p>
          <p v-if="emailSaved" class="success-msg mt-1">{{ t('profile.credentials.emailPending') }}</p>
          <button class="btn btn-secondary btn-sm mt-2" :disabled="savingEmail" @click="saveEmail">
            {{ savingEmail ? t('profile.account.saving') : t('profile.credentials.changeEmail') }}
          </button>
        </div>

        <div v-if="auth.user?.providers?.google || auth.user?.providers?.facebook" class="credential-block mt-3">
          <h4>{{ t('profile.credentials.linkedProviders') }}</h4>
          <div class="flex gap-2">
            <span v-if="auth.user.providers.google" class="badge badge-ocean">Google</span>
            <span v-if="auth.user.providers.facebook" class="badge badge-ocean">Facebook</span>
          </div>
        </div>
      </section>

      <!-- Aspetto -->
      <section class="card">
        <h3>{{ t('profile.appearance.title') }}</h3>
        <p class="text-muted text-sm mb-3">{{ t('profile.appearance.hint') }}</p>
        <div class="theme-toggle">
          <button
            type="button"
            class="btn btn-sm"
            :class="theme.mode === 'light' ? 'btn-primary' : 'btn-ghost'"
            @click="theme.setMode('light')"
          >
            <Sun :size="15" /> {{ t('profile.appearance.light') }}
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="theme.mode === 'dark' ? 'btn-primary' : 'btn-ghost'"
            @click="theme.setMode('dark')"
          >
            <Moon :size="15" /> {{ t('profile.appearance.dark') }}
          </button>
        </div>
      </section>

      <!-- Privacy -->
      <section class="card">
        <h3>{{ t('profile.privacy.title') }}</h3>
        <div class="form-group">
          <label>{{ t('profile.privacy.defaultVisibilityLabel') }}</label>
          <select v-model="defaultVisibility">
            <option value="private">{{ t('session.view.visibility.private') }}</option>
            <option value="users">{{ t('session.view.visibility.users') }}</option>
            <option value="group">{{ t('session.view.visibility.group') }}</option>
            <option value="public">{{ t('posts.visibility.public') }}</option>
          </select>
        </div>
        <p class="text-muted text-sm mt-1">{{ t('profile.privacy.hint') }}</p>
        <button class="btn btn-primary btn-sm mt-2" :disabled="savingAccount" @click="saveAccount">
          {{ t('common.save') }}
        </button>
      </section>

      <!-- Danger zone -->
      <section class="card danger-zone">
        <h3>{{ t('profile.danger.title') }}</h3>
        <p class="text-muted text-sm">{{ t('profile.danger.text') }}</p>
        <button class="btn btn-danger btn-sm mt-2" @click="showDeleteDialog = true">
          {{ t('profile.danger.deleteAccount') }}
        </button>
      </section>
    </div>

    <Teleport to="body">
      <div v-if="showDeleteDialog" class="dialog-overlay" @click.self="showDeleteDialog = false">
        <div class="dialog card">
          <h3>{{ t('profile.danger.title') }}</h3>
          <p class="text-muted mt-1">{{ t('profile.danger.confirm') }}</p>
          <div v-if="auth.user?.hasPassword" class="form-group mt-2">
            <label>{{ t('profile.credentials.currentPassword') }}</label>
            <input v-model="deletePassword" type="password" />
          </div>
          <p v-if="deleteError" class="error-msg mt-2">{{ deleteError }}</p>
          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.25rem">
            <button class="btn btn-ghost btn-sm" @click="showDeleteDialog = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-danger btn-sm" :disabled="deleting" @click="doDeleteAccount">
              {{ deleting ? t('profile.account.saving') : t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Sun, Moon } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import { useFeaturesStore } from '../stores/features.js'
import { useThemeStore } from '../stores/theme.js'

const { t } = useI18n()
const auth  = useAuthStore()
const features = useFeaturesStore()
const theme = useThemeStore()
const router = useRouter()

const initials = computed(() => {
  const name = auth.user?.displayName || auth.user?.email || '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

// ── account ──
const displayName = ref(auth.user?.displayName || '')
const defaultVisibility = ref(auth.user?.defaultVisibility || 'public')
const savingAccount = ref(false)
const accountError  = ref('')
const accountSaved  = ref(false)

async function saveAccount() {
  accountError.value = ''
  accountSaved.value = false
  savingAccount.value = true
  try {
    await auth.updateProfile({ displayName: displayName.value, defaultVisibility: defaultVisibility.value })
    accountSaved.value = true
    setTimeout(() => accountSaved.value = false, 2000)
  } catch (e) {
    accountError.value = e.response?.data?.error || t('common.error')
  } finally { savingAccount.value = false }
}

// ── avatar ──
const fileInput = ref(null)
const uploadingAvatar = ref(false)

async function onAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  uploadingAvatar.value = true
  try {
    await auth.uploadAvatar(file)
  } catch (e2) {
    accountError.value = e2.response?.data?.error || t('common.error')
  } finally {
    uploadingAvatar.value = false
    e.target.value = ''
  }
}

// ── password ──
const pwForm = ref({ currentPassword: '', newPassword: '' })
const savingPw = ref(false)
const pwError  = ref('')
const pwSaved  = ref(false)

async function savePassword() {
  pwError.value = ''
  pwSaved.value = false
  savingPw.value = true
  try {
    await auth.changePassword(pwForm.value.currentPassword, pwForm.value.newPassword)
    pwSaved.value = true
    pwForm.value = { currentPassword: '', newPassword: '' }
  } catch (e) {
    pwError.value = e.response?.data?.error || t('common.error')
  } finally { savingPw.value = false }
}

// ── email ──
const emailForm = ref({ newEmail: '', currentPassword: '' })
const savingEmail = ref(false)
const emailError  = ref('')
const emailSaved  = ref(false)

async function saveEmail() {
  emailError.value = ''
  emailSaved.value = false
  if (!emailForm.value.newEmail) { emailError.value = t('profile.credentials.emailRequired'); return }
  savingEmail.value = true
  try {
    await auth.changeEmail(emailForm.value.newEmail, emailForm.value.currentPassword)
    emailSaved.value = true
    emailForm.value = { newEmail: '', currentPassword: '' }
  } catch (e) {
    emailError.value = e.response?.data?.error || t('common.error')
  } finally { savingEmail.value = false }
}

// ── danger zone ──
const showDeleteDialog = ref(false)
const deletePassword = ref('')
const deleteError = ref('')
const deleting = ref(false)

async function doDeleteAccount() {
  deleteError.value = ''
  deleting.value = true
  try {
    await auth.deleteAccount(deletePassword.value)
    router.push('/login')
  } catch (e) {
    deleteError.value = e.response?.data?.error || t('common.error')
  } finally { deleting.value = false }
}
</script>

<style scoped>
.page-header  { @apply mb-6; }
.profile-grid { @apply grid gap-4; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }

.theme-toggle { @apply flex gap-2; }
.theme-toggle .btn { @apply gap-1.5; }

.avatar-row { @apply flex items-center gap-4; }
.avatar { @apply w-16 h-16 rounded-full object-cover; }
.avatar-placeholder {
  @apply w-16 h-16 rounded-full border border-ocean text-ocean flex items-center
         justify-center text-lg font-bold;
  background: var(--ocean-glow);
}
.hidden { display: none; }

.credential-block h4 { @apply text-sm font-semibold text-muted uppercase tracking-wide mb-2; }
.coming-soon { @apply flex items-center gap-2 text-muted text-sm; }

.error-msg   { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }
.success-msg { @apply bg-success/10 border border-success rounded-sm text-success text-xs px-2.5 py-1.5; }

.danger-zone { @apply border border-danger/40; }

.dialog-overlay { @apply fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center; }
.dialog         { @apply max-w-sm w-[90%]; }
</style>
