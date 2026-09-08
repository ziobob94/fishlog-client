<template>
  <div>
    <div v-if="store.loading" class="state-center"><div class="spinner"></div></div>

    <div v-else-if="!store.groups.length" class="state-center">
      <div style="font-size:3rem; display:flex; justify-content:center"><Users :size="48" /></div>
      <h3>{{ t('groups.empty.title') }}</h3>
      <p class="text-muted mt-1">{{ t('groups.empty.text') }}</p>
      <button class="btn btn-primary mt-2" @click="showCreate = true">{{ t('groups.empty.create') }}</button>
    </div>

    <div v-else class="groups-grid">
      <div v-for="g in store.groups" :key="g._id" class="group-card card">
        <div class="group-header">
          <div>
            <h3>{{ g.name }}</h3>
            <p v-if="g.description" class="text-muted" style="font-size:.85rem;margin-top:.2rem">{{ g.description }}</p>
          </div>
          <span class="badge badge-ocean">{{ t('groups.membersCount', { n: g.members?.length || 0 }) }}</span>
        </div>

        <div class="members-list">
          <div v-for="m in g.members" :key="m._id" class="member-row">
            <div class="member-info">
              <img v-if="m.avatar" :src="m.avatar" class="mini-avatar" />
              <span v-else class="mini-placeholder">{{ initials(m) }}</span>
              <span class="member-name">{{ m.displayName || m.email }}</span>
              <span v-if="m._id === g.owner?._id" class="badge badge-sand shrink-0" style="font-size:.6rem">{{ t('groups.owner') }}</span>
            </div>
            <button
              v-if="canRemove(g, m)"
              class="btn btn-ghost btn-sm shrink-0"
              @click="removeMember(g, m)"
            ><X :size="14" /></button>
          </div>
        </div>

        <!-- Aggiungi membro -->
        <div v-if="isOwnerOrAdmin(g)" class="add-member">
          <input
            v-model="inviteEmail[g._id]"
            type="email"
            :placeholder="t('groups.addMemberPlaceholder')"
            @keydown.enter="addMember(g)"
          />
          <button class="btn btn-secondary btn-sm" @click="addMember(g)">{{ t('common.add') }}</button>
        </div>
        <p v-if="errors[g._id]" class="error-msg">{{ errors[g._id] }}</p>

        <!-- Azioni gruppo -->
        <div v-if="isOwnerOrAdmin(g)" class="group-actions">
          <button class="btn btn-ghost btn-sm" @click="startEdit(g)" style="display:inline-flex;align-items:center;gap:.4rem"><Pencil :size="14" /> {{ t('groups.editAction') }}</button>
          <button class="btn btn-danger btn-sm" @click="confirmDelete(g)" style="display:inline-flex;align-items:center;gap:.4rem"><Trash2 :size="14" /> {{ t('groups.deleteAction') }}</button>
        </div>
      </div>
    </div>

    <!-- Modal crea/modifica gruppo -->
    <Teleport to="body">
      <div v-if="showCreate || editTarget" class="dialog-overlay" @click.self="closeModal">
        <div class="dialog card">
          <h3>{{ editTarget ? t('groups.modal.editTitle') : t('groups.modal.newTitle') }}</h3>
          <div class="form-group mt-2">
            <label>{{ t('groups.modal.nameLabel') }}</label>
            <input v-model="groupForm.name" type="text" :placeholder="t('groups.modal.namePlaceholder')" />
          </div>
          <div class="form-group mt-1">
            <label>{{ t('groups.modal.descLabel') }}</label>
            <input v-model="groupForm.description" type="text" :placeholder="t('groups.modal.descPlaceholder')" />
          </div>
          <p v-if="modalError" class="error-msg mt-1">{{ modalError }}</p>
          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.25rem">
            <button class="btn btn-ghost btn-sm" @click="closeModal">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveGroup">
              {{ saving ? t('groups.modal.saving') : (editTarget ? t('groups.modal.update') : t('groups.modal.create')) }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm delete -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="dialog-overlay" @click.self="deleteTarget = null">
        <div class="dialog card">
          <h3>{{ t('groups.deleteDialog.title') }}</h3>
          <p class="text-muted mt-1">{{ t('groups.deleteDialog.confirm', { name: deleteTarget.name }) }}</p>
          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.25rem">
            <button class="btn btn-ghost btn-sm" @click="deleteTarget = null">{{ t('common.cancel') }}</button>
            <button class="btn btn-danger btn-sm" @click="doDelete">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Users, X, Pencil, Trash2 } from 'lucide-vue-next'
import { useGroupStore } from '../stores/groups.js'
import { useAuthStore } from '../stores/auth.js'
import api from '../utils/api.js'

const { t }     = useI18n()
const route     = useRoute()
const router    = useRouter()
const store    = useGroupStore()
const authStore = useAuthStore()

const showCreate  = ref(false)
const editTarget  = ref(null)
const deleteTarget = ref(null)
const saving      = ref(false)
const modalError  = ref('')
const inviteEmail = ref({})
const errors      = ref({})

const groupForm = ref({ name: '', description: '' })

onMounted(() => store.fetchGroups())

// Il tasto + della topbar, quando si è già su questa pagina, apre il modal
// tramite un cambio di query invece che con un evento diretto.
watch(() => route.query.compose, (value) => {
  if (!value) return
  showCreate.value = true
  router.replace({ query: { ...route.query, compose: undefined } })
}, { immediate: true })

function isOwnerOrAdmin(g) {
  return g.owner?._id === authStore.user?._id || authStore.user?.role === 'admin'
}

function canRemove(g, m) {
  const isOwner = g.owner?._id === authStore.user?._id
  const isAdmin = authStore.user?.role === 'admin'
  const isSelf  = m._id === authStore.user?._id
  const notOwner = m._id !== g.owner?._id
  return notOwner && (isOwner || isAdmin || isSelf)
}

function initials(u) {
  const name = u.displayName || u.email || '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function startEdit(g) {
  editTarget.value = g
  groupForm.value = { name: g.name, description: g.description || '' }
}

function closeModal() {
  showCreate.value = false
  editTarget.value = null
  groupForm.value  = { name: '', description: '' }
  modalError.value = ''
}

async function saveGroup() {
  if (!groupForm.value.name.trim()) { modalError.value = t('groups.modal.nameRequired'); return }
  saving.value = true; modalError.value = ''
  try {
    if (editTarget.value) {
      await api.patch(`/groups/${editTarget.value._id}`, groupForm.value)
      await store.fetchGroups()
    } else {
      await store.createGroup(groupForm.value.name, groupForm.value.description)
    }
    closeModal()
  } catch (e) {
    modalError.value = e.response?.data?.error || t('common.error')
  } finally { saving.value = false }
}

function confirmDelete(g) { deleteTarget.value = g }
async function doDelete() {
  await store.deleteGroup(deleteTarget.value._id)
  deleteTarget.value = null
}

async function addMember(g) {
  const email = inviteEmail.value[g._id]?.trim()
  if (!email) return
  errors.value[g._id] = ''
  try {
    // Cerca userId per email
    const { data: users } = await api.get('/users', { params: { search: email } })
    const found = users.data?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!found) { errors.value[g._id] = t('groups.errors.userNotFound'); return }
    await store.addMember(g._id, found._id)
    inviteEmail.value[g._id] = ''
  } catch (e) {
    errors.value[g._id] = e.response?.data?.error || t('common.error')
  }
}

async function removeMember(g, m) {
  await store.removeMember(g._id, m._id)
}
</script>

<style scoped>
.groups-grid  { @apply grid gap-4; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
.group-card   { @apply flex flex-col gap-3; }
.group-header { @apply flex items-start justify-between; }

.members-list { @apply flex flex-col gap-1.5; }
.member-row   { @apply flex items-center justify-between gap-2; }
.member-info  { @apply flex items-center gap-2 text-sm text-foam min-w-0 flex-1; }
.member-name  { @apply truncate; }

.mini-avatar { @apply w-7 h-7 rounded-full object-cover; }
.mini-placeholder {
  @apply w-7 h-7 rounded-full border border-ocean text-ocean flex items-center
         justify-center text-[0.65rem] font-bold;
  background: var(--ocean-glow);
}

.add-member { @apply flex gap-2; }
.add-member input { @apply text-sm; }

.group-actions { @apply flex gap-2 border-t border-border pt-3; }

.error-msg { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }

.dialog-overlay { @apply fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center; }
.dialog         { @apply max-w-sm w-[90%]; }
</style>