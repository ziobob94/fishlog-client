<template>
  <div>
    <h2>Pannello Admin</h2>

    <div class="admin-tabs">
      <button class="btn" :class="tab === 'users' ? 'btn-primary' : 'btn-ghost'" @click="tab = 'users'">Utenti</button>
      <button class="btn" :class="tab === 'sessions' ? 'btn-primary' : 'btn-ghost'" @click="tab = 'sessions'">Sessioni</button>
    </div>

    <!-- UTENTI -->
    <div v-if="tab === 'users'">
      <div class="toolbar">
        <input v-model="userSearch" type="search" placeholder="Cerca utente..." style="max-width:280px" @input="debouncedUsers" />
      </div>

      <div v-if="loadingUsers" class="state-center"><div class="spinner"></div></div>
      <table v-else class="admin-table">
        <thead>
          <tr><th>Utente</th><th>Email</th><th>Ruolo</th><th>Registrato</th><th>Azioni</th></tr>
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
              >Elimina</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination mt-2">
        <button class="btn btn-ghost btn-sm" :disabled="userPage <= 1" @click="userPage--; fetchUsers()">← Prec</button>
        <span class="text-muted text-mono" style="font-size:.85rem">{{ userPage }} / {{ userPages }}</span>
        <button class="btn btn-ghost btn-sm" :disabled="userPage >= userPages" @click="userPage++; fetchUsers()">Succ →</button>
      </div>
    </div>

    <!-- SESSIONI -->
    <div v-if="tab === 'sessions'">
      <div class="toolbar">
        <label style="flex-direction:row;align-items:center;gap:.5rem;text-transform:none;letter-spacing:0;font-size:.85rem">
          <input type="checkbox" v-model="showHidden" @change="fetchSessions" />
          Mostra solo nascoste
        </label>
      </div>

      <div v-if="loadingSessions" class="state-center"><div class="spinner"></div></div>
      <table v-else class="admin-table">
        <thead>
          <tr><th>Titolo</th><th>Autore</th><th>Data</th><th>Visibilità</th><th>Nascosta</th><th>Azioni</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in adminSessions" :key="s._id" :class="{ 'row-hidden': s.hidden }">
            <td>{{ s.title || s.location?.name }}</td>
            <td class="text-muted" style="font-size:.82rem">{{ s.userId?.displayName || s.userId?.email }}</td>
            <td class="text-mono text-muted" style="font-size:.78rem">{{ fmtDate(s.date) }}</td>
            <td><span class="badge badge-ocean">{{ s.visibility }}</span></td>
            <td>
              <span v-if="s.hidden" class="badge badge-sand">Nascosta</span>
              <span v-else class="text-muted" style="font-size:.8rem">—</span>
            </td>
            <td>
              <button class="btn btn-ghost btn-sm" @click="toggleHide(s)">
                {{ s.hidden ? 'Mostra' : 'Nascondi' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirm delete dialog -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="dialog-overlay" @click.self="deleteTarget = null">
        <div class="dialog card">
          <h3>Elimina utente</h3>
          <p class="text-muted mt-1">Verranno eliminate anche tutte le sessioni di <strong>{{ deleteTarget.displayName }}</strong>.</p>
          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.25rem">
            <button class="btn btn-ghost btn-sm" @click="deleteTarget = null">Annulla</button>
            <button class="btn btn-danger btn-sm" @click="doDeleteUser">Elimina</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import api from '../utils/api.js'

const authStore = useAuthStore()
const tab = ref('users')

// Users
const users        = ref([])
const userSearch   = ref('')
const userPage     = ref(1)
const userPages    = ref(1)
const loadingUsers = ref(false)
const deleteTarget = ref(null)

async function fetchUsers() {
  loadingUsers.value = true
  try {
    const { data } = await api.get('/admin/users', { params: { page: userPage.value, search: userSearch.value || undefined } })
    users.value = data.data
    userPages.value = data.pagination.pages
  } finally { loadingUsers.value = false }
}

let timer
function debouncedUsers() { clearTimeout(timer); timer = setTimeout(fetchUsers, 320) }

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

onMounted(() => { fetchUsers(); fetchSessions() })
</script>

<style scoped>
.admin-tabs { @apply flex gap-2 my-5; }
.toolbar    { @apply flex items-center gap-4 mb-4; }

.admin-table { @apply w-full border-collapse; }
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
</style>