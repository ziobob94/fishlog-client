<template>
  <div>
    <h2>{{ t('admin.title') }}</h2>

    <div class="admin-tabs">
      <button class="btn" :class="tab === 'users' ? 'btn-primary' : 'btn-ghost'" @click="tab = 'users'">{{ t('admin.tabs.users') }}</button>
      <button class="btn" :class="tab === 'sessions' ? 'btn-primary' : 'btn-ghost'" @click="tab = 'sessions'">{{ t('admin.tabs.sessions') }}</button>
      <button class="btn" :class="tab === 'shops' ? 'btn-primary' : 'btn-ghost'" @click="tab = 'shops'">
        {{ t('admin.tabs.shops') }}
        <span v-if="pendingShops.length" class="badge badge-sand ml-1">{{ pendingShops.length }}</span>
      </button>
      <button class="btn" :class="tab === 'config' ? 'btn-primary' : 'btn-ghost'" @click="tab = 'config'">{{ t('admin.tabs.config') }}</button>
    </div>

    <!-- UTENTI -->
    <div v-if="tab === 'users'">
      <div class="toolbar">
        <input v-model="userSearch" type="search" :placeholder="t('admin.users.searchPlaceholder')" style="max-width:280px" @input="debouncedSearchUsers" />
      </div>

      <div v-if="pagination.loading.value" class="state-center"><div class="spinner"></div></div>
      <div v-else class="table-scroll">
        <table class="admin-table">
          <thead>
            <tr><th>{{ t('admin.users.table.user') }}</th><th>{{ t('admin.users.table.email') }}</th><th>{{ t('admin.users.table.role') }}</th><th>{{ t('admin.users.table.registered') }}</th><th>{{ t('admin.users.table.actions') }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u._id">
              <td>
                <div class="user-cell">
                  <img v-if="u.avatar" :src="u.avatar" class="mini-avatar" />
                  <span>{{ u.displayName }}</span>
                </div>
              </td>
              <td class="text-muted text-mono" style="font-size:.8rem">{{ u.email }}</td>
              <td>
                <select
                  :value="u.role"
                  class="role-select"
                  :disabled="u._id === authStore.user._id"
                  @change="changeRole(u, $event.target.value)"
                >
                  <option value="user">user</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td class="text-muted text-mono" style="font-size:.78rem">{{ fmtDate(u.createdAt) }}</td>
              <td>
                <button
                  class="btn btn-danger btn-sm"
                  :disabled="u._id === authStore.user._id"
                  @click="confirmDeleteUser(u)"
                >{{ t('common.delete') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination mt-2">
        <button class="btn btn-ghost btn-sm" :disabled="pagination.page.value <= 1" @click="pagination.goTo(pagination.page.value - 1)">{{ t('common.prevPage') }}</button>
        <span class="text-muted text-mono" style="font-size:.85rem">{{ pagination.page.value }} / {{ pagination.pages.value }}</span>
        <button class="btn btn-ghost btn-sm" :disabled="pagination.page.value >= pagination.pages.value" @click="pagination.goTo(pagination.page.value + 1)">{{ t('common.nextPage') }}</button>
      </div>
    </div>

    <!-- SESSIONI -->
    <div v-if="tab === 'sessions'">
      <div class="toolbar">
        <label style="flex-direction:row;align-items:center;gap:.5rem;text-transform:none;letter-spacing:0;font-size:.85rem">
          <input type="checkbox" v-model="showHidden" @change="fetchSessions" />
          {{ t('admin.sessions.showHiddenOnly') }}
        </label>
      </div>

      <div v-if="loadingSessions" class="state-center"><div class="spinner"></div></div>
      <div v-else class="table-scroll">
        <table class="admin-table">
          <thead>
            <tr><th>{{ t('admin.sessions.table.title') }}</th><th>{{ t('admin.sessions.table.author') }}</th><th>{{ t('admin.sessions.table.date') }}</th><th>{{ t('admin.sessions.table.visibility') }}</th><th>{{ t('admin.sessions.table.hidden') }}</th><th>{{ t('admin.sessions.table.actions') }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="s in adminSessions" :key="s._id" :class="{ 'row-hidden': s.hidden }">
              <td>{{ s.title || s.location?.name }}</td>
              <td class="text-muted" style="font-size:.82rem">{{ s.userId?.displayName || s.userId?.email }}</td>
              <td class="text-mono text-muted" style="font-size:.78rem">{{ fmtDate(s.date) }}</td>
              <td><span class="badge badge-ocean">{{ s.visibility }}</span></td>
              <td>
                <span v-if="s.hidden" class="badge badge-sand">{{ t('admin.sessions.hiddenBadge') }}</span>
                <span v-else class="text-muted" style="font-size:.8rem">{{ t('common.none') }}</span>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm" @click="toggleHide(s)">
                  {{ s.hidden ? t('admin.sessions.show') : t('admin.sessions.hide') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- NEGOZI -->
    <div v-if="tab === 'shops'">
      <div v-if="loadingShops" class="state-center"><div class="spinner"></div></div>

      <div v-else-if="!pendingShops.length" class="state-center">
        <p class="text-muted">{{ t('admin.shops.empty') }}</p>
      </div>

      <div v-else class="table-scroll">
        <table class="admin-table">
          <thead>
            <tr><th>{{ t('admin.shops.table.name') }}</th><th>{{ t('admin.shops.table.owner') }}</th><th>{{ t('admin.shops.table.description') }}</th><th>{{ t('admin.shops.table.requestedAt') }}</th><th>{{ t('admin.shops.table.actions') }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="u in pendingShops" :key="u._id">
              <td>{{ u.shop.name || t('common.none') }}</td>
              <td class="text-muted" style="font-size:.82rem">{{ u.displayName || u.email }}</td>
              <td class="text-muted" style="font-size:.82rem;max-width:280px">{{ u.shop.description }}</td>
              <td class="text-mono text-muted" style="font-size:.78rem">{{ fmtDate(u.shop.verificationRequestedAt) }}</td>
              <td>
                <div class="flex gap-1.5">
                  <button class="btn btn-primary btn-sm" @click="approveShop(u)">{{ t('admin.shops.approve') }}</button>
                  <button class="btn btn-danger btn-sm" @click="rejectShop(u)">{{ t('admin.shops.reject') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CONFIGURAZIONI -->
    <div v-if="tab === 'config'">
      <p class="text-muted text-sm mb-3">{{ t('admin.config.intro') }}</p>

      <div v-if="loadingConfig" class="state-center"><div class="spinner"></div></div>
      <template v-else>
        <section v-for="group in configGroups" :key="group.name" class="card mb-3">
          <h3>{{ group.name }}</h3>
          <div v-for="field in group.fields" :key="field.key" class="form-group">
            <label>{{ field.label }}</label>

            <input
              v-if="field.type === 'boolean'"
              type="checkbox"
              v-model="configForm[field.key]"
              class="config-checkbox"
            />
            <input
              v-else
              :type="field.secret ? 'password' : (field.type === 'number' ? 'number' : 'text')"
              v-model="configForm[field.key]"
              :placeholder="field.secret ? (field.hasValue ? t('admin.config.secretSetHint') : t('admin.config.secretPlaceholder')) : ''"
              autocomplete="off"
            />
          </div>
        </section>

        <button class="btn btn-primary" :disabled="savingConfig" @click="saveConfig">{{ t('admin.config.save') }}</button>
      </template>
    </div>

    <!-- Confirm delete dialog -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="dialog-overlay" @click.self="deleteTarget = null">
        <div class="dialog card">
          <h3>{{ t('admin.deleteUser.title') }}</h3>
          <p class="text-muted mt-1">{{ t('admin.deleteUser.warning', { name: deleteTarget.displayName }) }}</p>
          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.25rem">
            <button class="btn btn-ghost btn-sm" @click="deleteTarget = null">{{ t('common.cancel') }}</button>
            <button class="btn btn-danger btn-sm" @click="doDeleteUser">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.js'
import { usePagination } from '../composables/usePagination.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'
import { useToast } from '../composables/useToast.js'
import api from '../utils/api.js'

const { t } = useI18n()
const { toast } = useToast()
const authStore = useAuthStore()
const tab = ref('users')

// Users
const users        = ref([])
const userSearch   = ref('')
const deleteTarget = ref(null)

async function fetchUsers(page) {
  const { data } = await api.get('/admin/users', { params: { page, search: userSearch.value || undefined } })
  users.value = data.data
  return data.pagination.pages
}

const pagination = usePagination(fetchUsers)
const debouncedSearchUsers = useDebouncedFn(() => pagination.reset(), 320)

async function changeRole(user, role) {
  await api.patch(`/admin/users/${user._id}/role`, { role })
  user.role = role
}

function confirmDeleteUser(u) { deleteTarget.value = u }
async function doDeleteUser() {
  await api.delete(`/admin/users/${deleteTarget.value._id}`)
  users.value = users.value.filter(u => u._id !== deleteTarget.value._id)
  deleteTarget.value = null
}

// Sessions
const adminSessions  = ref([])
const showHidden     = ref(false)
const loadingSessions = ref(false)

async function fetchSessions() {
  loadingSessions.value = true
  try {
    const { data } = await api.get('/admin/sessions', { params: { hidden: showHidden.value || undefined } })
    adminSessions.value = data.data
  } finally { loadingSessions.value = false }
}

async function toggleHide(s) {
  await api.patch(`/sessions/${s._id}/hide`, { hidden: !s.hidden })
  s.hidden = !s.hidden
}

const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })

// Negozi in attesa di verifica
const pendingShops  = ref([])
const loadingShops  = ref(false)

async function fetchPendingShops() {
  loadingShops.value = true
  try {
    const { data } = await api.get('/admin/shops/pending')
    pendingShops.value = data.data
  } finally { loadingShops.value = false }
}

async function approveShop(u) {
  await api.post(`/admin/shops/${u._id}/approve`)
  pendingShops.value = pendingShops.value.filter(x => x._id !== u._id)
}

async function rejectShop(u) {
  await api.post(`/admin/shops/${u._id}/reject`)
  pendingShops.value = pendingShops.value.filter(x => x._id !== u._id)
}

// Configurazioni (eBay, OAuth, SMTP, feature flag...): niente più editing
// di file + riavvio, si salva da qui e vale subito.
const configFields  = ref([])
const configForm    = reactive({})
const loadingConfig = ref(false)
const savingConfig  = ref(false)

const configGroups = computed(() => {
  const byGroup = new Map()
  for (const field of configFields.value) {
    if (!byGroup.has(field.group)) byGroup.set(field.group, [])
    byGroup.get(field.group).push(field)
  }
  return Array.from(byGroup, ([name, fields]) => ({ name, fields }))
})

async function fetchConfig() {
  loadingConfig.value = true
  try {
    const { data } = await api.get('/admin/config')
    configFields.value = data
    data.forEach(field => { configForm[field.key] = field.value ?? (field.type === 'boolean' ? false : '') })
  } catch {
    toast(t('admin.config.loadError'), { type: 'danger' })
  } finally {
    loadingConfig.value = false
  }
}

async function saveConfig() {
  savingConfig.value = true
  try {
    const payload = configFields.value.map(field => ({ key: field.key, value: configForm[field.key] }))
    await api.put('/admin/config', payload)
    toast(t('admin.config.saved'), { type: 'success' })
    await fetchConfig()
  } catch {
    toast(t('admin.config.saveError'), { type: 'danger' })
  } finally {
    savingConfig.value = false
  }
}

onMounted(() => { pagination.load(); fetchSessions(); fetchPendingShops(); fetchConfig() })
</script>

<style scoped>
.admin-tabs { @apply flex flex-wrap gap-2 my-5; }
.toolbar    { @apply flex flex-wrap items-center gap-4 mb-4; }

.table-scroll { @apply w-full overflow-x-auto; -webkit-overflow-scrolling: touch; }
.admin-table { @apply w-full border-collapse; min-width: 640px; }
.admin-table th,
.admin-table td { @apply border-b border-border px-3 py-2.5 text-left text-sm; }
.admin-table th { @apply text-muted text-xs uppercase tracking-wide font-bold; }
.admin-table tbody tr:hover { @apply bg-surface-2; }
.row-hidden { @apply opacity-50; }

.user-cell   { @apply flex items-center gap-2; }
.mini-avatar { @apply w-6 h-6 rounded-full object-cover; }

.role-select {
  @apply bg-surface-2 border border-border rounded text-foam text-xs px-1.5 py-1;
}
.role-select:disabled { @apply opacity-40; }

.dialog-overlay { @apply fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center; }
.dialog         { @apply max-w-sm w-[90%]; }

.config-checkbox { @apply w-auto accent-ocean; }
</style>