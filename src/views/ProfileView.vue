<template>
  <div>
    <PageHeader :title="t('profile.settingsTitle')" back />

    <div class="profile-grid">
      <!-- Credenziali -->
      <section class="card">
        <h3>{{ t('profile.credentials.title') }}</h3>

        <p v-if="!features.passwordAuthEnabled" class="coming-soon mb-3">
          <span class="badge badge-sand">{{ t('home.hub.comingSoon') }}</span>
          {{ t('profile.credentials.disabled') }}
        </p>

        <form v-if="features.passwordAuthEnabled && auth.user?.hasPassword" class="credential-block" @submit.prevent="savePassword">
          <h4>{{ t('profile.credentials.passwordTitle') }}</h4>
          <div class="form-group">
            <label>{{ t('profile.credentials.currentPassword') }}</label>
            <PasswordInput v-model="pwForm.currentPassword" required />
          </div>
          <div class="form-group mt-1">
            <label>{{ t('profile.credentials.newPassword') }}</label>
            <PasswordInput v-model="pwForm.newPassword" required />
          </div>
          <p v-if="pwError" class="error-msg mt-1">{{ pwError }}</p>
          <p v-if="pwSaved" class="success-msg mt-1">{{ t('profile.credentials.passwordUpdated') }}</p>
          <button type="submit" class="btn btn-secondary btn-sm mt-2" :disabled="savingPw">
            {{ savingPw ? t('profile.account.saving') : t('profile.credentials.changePassword') }}
          </button>
        </form>
        <p v-else-if="features.passwordAuthEnabled" class="text-muted text-sm">{{ t('profile.credentials.oauthOnly') }}</p>

        <form v-if="features.passwordAuthEnabled" class="credential-block mt-3" @submit.prevent="saveEmail">
          <h4>{{ t('profile.credentials.emailTitle') }}</h4>
          <p v-if="auth.user?.pendingEmail" class="success-msg mb-2">
            {{ t('profile.credentials.pendingEmail', { email: auth.user.pendingEmail }) }}
          </p>
          <div class="form-group">
            <label>{{ t('profile.credentials.newEmail') }}</label>
            <input v-model="emailForm.newEmail" type="email" required :placeholder="auth.user?.email" />
          </div>
          <div v-if="auth.user?.hasPassword" class="form-group mt-1">
            <label>{{ t('profile.credentials.currentPassword') }}</label>
            <PasswordInput v-model="emailForm.currentPassword" required />
          </div>
          <p v-if="emailError" class="error-msg mt-1">{{ emailError }}</p>
          <p v-if="emailSaved" class="success-msg mt-1">{{ t('profile.credentials.emailPending') }}</p>
          <button type="submit" class="btn btn-secondary btn-sm mt-2" :disabled="savingEmail">
            {{ savingEmail ? t('profile.account.saving') : t('profile.credentials.changeEmail') }}
          </button>
        </form>

        <div v-if="auth.user?.providers?.google || auth.user?.providers?.facebook" class="credential-block mt-3">
          <h4>{{ t('profile.credentials.linkedProviders') }}</h4>
          <div class="flex gap-2">
            <span v-if="auth.user.providers.google" class="badge badge-ocean">Google</span>
            <span v-if="auth.user.providers.facebook" class="badge badge-ocean">Facebook</span>
          </div>
        </div>
      </section>

      <!-- Notifiche -->
      <section id="notifications" class="card">
        <h3>{{ t('profile.notifications.title') }}</h3>
        <p class="text-muted text-sm mb-3">{{ t('profile.notifications.hint') }}</p>

        <div v-for="item in notificationItems" :key="item.key" class="notification-row">
          <div>
            <strong>{{ t(`profile.notifications.${item.key}`) }}</strong>
            <p class="text-muted text-sm">{{ t(`profile.notifications.${item.key}Hint`) }}</p>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="notifForm[item.key]" @change="saveNotifications" />
            <span class="switch-track"></span>
          </label>
        </div>

        <p v-if="notifError" class="error-msg mt-2">{{ notifError }}</p>
        <p v-if="notifSaved" class="success-msg mt-2">{{ t('common.save') }} ✓</p>
      </section>

      <!-- Aspetto -->
      <section class="card">
        <h3>{{ t('profile.appearance.title') }}</h3>
        <p class="text-muted text-sm mb-3">{{ t('profile.appearance.hint') }}</p>
        <div class="theme-toggle" role="radiogroup" :aria-label="t('profile.appearance.title')">
          <button type="button" role="radio" :aria-checked="theme.mode === 'dark'" class="theme-opt" :class="{ active: theme.mode === 'dark' }" @click="theme.setMode('dark')">
            <Moon :size="15" /> {{ t('profile.appearance.dark') }}
          </button>
          <button type="button" role="radio" :aria-checked="theme.mode === 'light'" class="theme-opt" :class="{ active: theme.mode === 'light' }" @click="theme.setMode('light')">
            <Sun :size="15" /> {{ t('profile.appearance.light') }}
          </button>
        </div>
      </section>

      <!-- Privacy -->
      <section id="privacy" class="card">
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

      <!-- Negozio / Market -->
      <section class="card">
        <h3>{{ t('profile.shop.title') }}</h3>
        <RouterLink to="/market/sell" class="btn btn-secondary btn-sm mb-2">{{ t('seller.becomeSeller') }}</RouterLink>
        <div class="notification-row">
          <div>
            <strong>{{ t('profile.shop.enable') }}</strong>
            <p class="text-muted text-sm">{{ t('profile.shop.enableHint') }}</p>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="shopForm.enabled" @change="saveShop" />
            <span class="switch-track"></span>
          </label>
        </div>

        <template v-if="shopForm.enabled">
          <span class="badge mt-3" :class="verificationBadgeClass">
            {{ t(`profile.shop.status.${auth.user?.shop?.verificationStatus || 'none'}`) }}
          </span>
          <p v-if="auth.user?.shop?.verificationStatus === 'pending'" class="text-muted text-sm mt-1">
            {{ t('profile.shop.pendingHint') }}
          </p>
          <p v-if="auth.user?.shop?.verificationStatus === 'rejected'" class="text-muted text-sm mt-1">
            {{ t('profile.shop.rejectedHint') }}
          </p>

          <div class="form-group mt-3">
            <label>{{ t('profile.shop.nameLabel') }}</label>
            <input v-model="shopForm.name" type="text" />
          </div>
          <div class="form-group mt-2">
            <label>{{ t('profile.shop.descriptionLabel') }}</label>
            <textarea v-model="shopForm.description" rows="3"></textarea>
          </div>
          <button class="btn btn-primary btn-sm mt-2" :disabled="savingShop" @click="saveShop">
            {{ t('common.save') }}
          </button>
          <RouterLink to="/market/mine" class="btn btn-secondary btn-sm mt-2 ml-2">
            {{ t('profile.shop.myListings') }}
          </RouterLink>
        </template>

        <p v-if="shopError" class="error-msg mt-2">{{ shopError }}</p>
        <p v-if="shopSaved" class="success-msg mt-2">{{ t('common.save') }} ✓</p>
      </section>

      <!-- Preferenze market -->
      <section class="card">
        <h3>{{ t('profile.marketPreferences.title') }}</h3>
        <p class="text-muted text-sm mb-3">{{ t('profile.marketPreferences.hint') }}</p>

        <div class="form-group">
          <label>{{ t('marketSurvey.techniqueLabel') }}</label>
          <select v-model="marketPrefsForm.technique">
            <option value="">{{ t('marketSurvey.techniquePlaceholder') }}</option>
            <option v-for="tch in TECHNIQUES" :key="tch.v" :value="tch.v">{{ tch.l }}</option>
          </select>
        </div>

        <div class="form-group mt-3">
          <label>{{ t('marketSurvey.categoriesLabel') }}</label>
          <div class="category-grid">
            <label v-for="c in market.categories" :key="c" class="category-check">
              <input v-model="marketPrefsForm.categories" type="checkbox" :value="c" />
              {{ t(`market.categories.${c}`) }}
            </label>
          </div>
        </div>

        <p v-if="marketPrefsError" class="error-msg mt-2">{{ marketPrefsError }}</p>
        <p v-if="marketPrefsSaved" class="success-msg mt-2">{{ t('common.save') }} ✓</p>
        <button class="btn btn-primary btn-sm mt-2" :disabled="savingMarketPrefs" @click="saveMarketPreferences">
          {{ savingMarketPrefs ? t('profile.account.saving') : t('common.save') }}
        </button>
      </section>

      <!-- Sessione -->
      <section class="card">
        <h3>{{ t('profile.session.title') }}</h3>
        <p class="text-muted text-sm">{{ t('profile.session.text') }}</p>
        <button class="btn btn-secondary btn-sm mt-2" @click="logout">
          {{ t('nav.logout') }}
        </button>
      </section>

      <!-- Dati personali (GDPR) -->
      <section class="card">
        <h3>I tuoi dati</h3>
        <p class="text-muted text-sm">
          Scarica una copia di tutti i tuoi dati (profilo, sessioni, post, annunci, amicizie, messaggi
          inviati) in formato JSON. Consulta anche l'
          <RouterLink to="/privacy-policy">Informativa Privacy</RouterLink>.
        </p>
        <button class="btn btn-secondary btn-sm mt-2" :disabled="exporting" @click="exportData">
          {{ exporting ? t('profile.account.saving') : 'Esporta i miei dati' }}
        </button>
        <p v-if="exportError" class="error-msg mt-2">{{ exportError }}</p>
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
            <PasswordInput v-model="deletePassword" />
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
  
    <nav class="more-links" :aria-label="t('profile.more')">
      <RouterLink to="/groups" class="more-link">{{ t('nav.groups') }} <ChevronRight :size="18" /></RouterLink>
      <RouterLink to="/board" class="more-link">{{ t('nav.board') }} <ChevronRight :size="18" /></RouterLink>
      <RouterLink to="/classifica" class="more-link">{{ t('nav.leaderboard') }} <ChevronRight :size="18" /></RouterLink>
      <RouterLink to="/species" class="more-link">{{ t('nav.species') }} <ChevronRight :size="18" /></RouterLink>
      <RouterLink v-if="auth.user?.role === 'admin'" to="/admin" class="more-link">{{ t('nav.admin') }} <ChevronRight :size="18" /></RouterLink>
    </nav>

    <button type="button" class="logout-btn" @click="doLogout">{{ t('nav.logout') }}</button>
  </div>
</template>

<script setup>
import { toInitials } from '../utils/initials.js'
import PageHeader from '../components/PageHeader.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Sun, Moon, Pencil, ChevronRight } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import { useFeaturesStore } from '../stores/features.js'
import { useMarketStore } from '../stores/market.js'
import PasswordInput from '../components/PasswordInput.vue'
import { useThemeStore } from '../stores/theme.js'
import api from '../utils/api.js'

const { t } = useI18n()
const auth  = useAuthStore()
const features = useFeaturesStore()
const theme = useThemeStore()
const market = useMarketStore()
const router = useRouter()
const route = useRoute()
function doLogout() { auth.logout(); window.location.assign('/login') }

onMounted(() => {
  if (!market.categories.length) market.fetchCategories()
  // Privacy / Notifiche dal menù del profilo portano direttamente alla sezione
  const sec = route.query.section
  if (sec) setTimeout(() => document.getElementById(String(sec))?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 150)
})

const initials = computed(() => {
  const name = auth.user?.displayName || auth.user?.email || '?'
return toInitials(name)
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
    await auth.updateProfile({ defaultVisibility: defaultVisibility.value })
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

// ── notifiche ──
const notificationItems = [
  { key: 'emailChatMessages' },
  { key: 'emailComments' },
  { key: 'emailLikes' },
  { key: 'emailFriendRequests' }
]
const notifForm = ref(Object.fromEntries(
  notificationItems.map(({ key }) => [key, auth.user?.notificationPreferences?.[key] !== false])
))
const notifError = ref('')
const notifSaved = ref(false)

async function saveNotifications() {
  notifError.value = ''
  notifSaved.value = false
  try {
    await auth.updateNotificationPreferences(notifForm.value)
    notifSaved.value = true
    setTimeout(() => notifSaved.value = false, 2000)
  } catch (e) {
    notifError.value = e.response?.data?.error || t('common.error')
    await auth.fetchMe()
    notifForm.value = Object.fromEntries(
      notificationItems.map(({ key }) => [key, auth.user?.notificationPreferences?.[key] !== false])
    )
  }
}

// ── negozio ──
const verificationBadgeClass = computed(() => ({
  verified: 'badge-success', pending: 'badge-sand', rejected: 'badge-danger', none: 'badge-sand'
}[auth.user?.shop?.verificationStatus || 'none']))

const shopForm = ref({
  enabled: auth.user?.shop?.enabled || false,
  name: auth.user?.shop?.name || '',
  description: auth.user?.shop?.description || ''
})
const savingShop = ref(false)
const shopError  = ref('')
const shopSaved  = ref(false)

async function saveShop() {
  shopError.value = ''
  shopSaved.value = false
  savingShop.value = true
  try {
    await auth.updateShop(shopForm.value)
    shopSaved.value = true
    setTimeout(() => shopSaved.value = false, 2000)
  } catch (e) {
    shopError.value = e.response?.data?.error || t('common.error')
  } finally { savingShop.value = false }
}

// ── esportazione dati ──
const exporting = ref(false)
const exportError = ref('')

async function exportData() {
  exportError.value = ''
  exporting.value = true
  try {
    const { data } = await api.get('/auth/me/export')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fishlog-dati.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    exportError.value = e.response?.data?.error || t('common.error')
  } finally { exporting.value = false }
}

// ── preferenze market ──
const TECHNIQUES = [
  { v: 'surfcasting', l: 'Surfcasting' }, { v: 'feeder', l: 'Feeder' },
  { v: 'spinning', l: 'Spinning' }, { v: 'bolentino', l: 'Bolentino' },
  { v: 'mosca', l: 'Mosca' }, { v: 'altro', l: 'Altro' }
]
const marketPrefsForm = ref({
  technique:  auth.user?.marketPreferences?.technique || '',
  categories: [...(auth.user?.marketPreferences?.categories || [])]
})
const savingMarketPrefs = ref(false)
const marketPrefsError  = ref('')
const marketPrefsSaved  = ref(false)

async function saveMarketPreferences() {
  marketPrefsError.value = ''
  marketPrefsSaved.value = false
  savingMarketPrefs.value = true
  try {
    await auth.updateMarketPreferences(marketPrefsForm.value)
    marketPrefsSaved.value = true
    setTimeout(() => marketPrefsSaved.value = false, 2000)
  } catch (e) {
    marketPrefsError.value = e.response?.data?.error || t('common.error')
  } finally { savingMarketPrefs.value = false }
}

// ── danger zone ──
const showDeleteDialog = ref(false)
const deletePassword = ref('')
const deleteError = ref('')
const deleting = ref(false)

// ── sessione ──
function logout() {
  auth.logout()
  // ricarica: azzera gli store in memoria così un altro account sullo stesso
  // dispositivo non vede dati del precedente
  window.location.assign('/login')
}

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
.profile-grid { @apply grid gap-4; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); }

.theme-toggle { @apply flex gap-1 p-1 bg-surface-2 border border-border rounded-xl; }
.theme-opt { @apply flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg bg-transparent border-none text-sm font-semibold text-foam cursor-pointer; }
.theme-opt.active { @apply bg-ocean text-on-primary; }

.identity { @apply flex items-center gap-4 mb-5; }
.avatar-wrap { @apply relative shrink-0; }
.identity-text { @apply min-w-0; }
.identity-name { @apply text-xl font-bold text-foam truncate; }
.identity-email { @apply text-sm text-muted truncate; }
.avatar-edit {
  @apply absolute bottom-0 right-0 w-9 h-9 flex items-center justify-center rounded-full bg-ocean text-on-primary border-2 border-ink cursor-pointer;
}
.more-links { @apply flex flex-col mt-4 rounded-xl border border-border bg-surface overflow-hidden; }
.more-link { @apply flex items-center justify-between px-4 min-h-[52px] text-foam font-bold no-underline border-b border-border; }
.more-link:last-child { @apply border-b-0; }
.logout-btn { @apply w-full min-h-[48px] mt-4 rounded-xl border border-danger text-danger bg-transparent font-bold cursor-pointer; }
.avatar { @apply w-[104px] h-[104px] rounded-full object-cover border-2 border-ocean; }
.avatar-placeholder {
  @apply w-[104px] h-[104px] rounded-full border-2 border-ocean text-ocean-text flex items-center
         justify-center text-3xl font-bold;
  background: var(--ocean-glow);
}
.hidden { display: none; }

.credential-block h4 { @apply text-xs font-semibold text-muted uppercase mb-2; letter-spacing: 0.14em; }
.coming-soon { @apply flex items-center gap-2 text-muted text-sm; }

.error-msg   { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }
.success-msg { @apply bg-success/10 border border-success rounded-sm text-success text-xs px-2.5 py-1.5; }

.notification-row { @apply flex items-center justify-between gap-3; }

.category-grid  { @apply grid grid-cols-2 gap-2 mt-1; }
.category-check {
  @apply flex items-center gap-2 text-sm text-foam;
  text-transform: none;
  letter-spacing: 0;
}
.category-check input { width: auto; }

.switch { @apply relative inline-block; width: 40px; height: 22px; flex-shrink: 0; }
.switch input { @apply absolute opacity-0 w-0 h-0; }
.switch-track {
  @apply absolute inset-0 rounded-full cursor-pointer;
  background: var(--border, #cbd5e1);
  transition: background .15s;
}
.switch-track::before {
  content: '';
  position: absolute; left: 2px; top: 2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; transition: transform .15s;
}
.switch input:checked + .switch-track { background: var(--ocean, #0ea5e9); }
.switch input:checked + .switch-track::before { transform: translateX(18px); }

.danger-zone { @apply border border-danger/40; }

.dialog-overlay { @apply fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center; }
.dialog         { @apply max-w-sm w-[90%]; }
</style>
