<template>
  <div>
    <PageHeader :title="t('gare.titolo')" back />
    <p class="text-sm text-muted mb-3">{{ t('gare.sottotitolo') }}</p>

    <div class="flex gap-2 mb-4">
      <button class="btn btn-primary" @click="nuova = !nuova">{{ t('gare.nuovaProva') }}</button>
    </div>

    <form v-if="nuova" class="card mb-4 grid gap-3 sm:grid-cols-2" @submit.prevent="crea">
      <h2 class="font-display text-lg sm:col-span-2">{{ t('gare.nuovaProvaTitolo') }}</h2>
      <label class="f sm:col-span-2">{{ t('gare.prova.manifestazione') }}<input v-model="n.manifestazione" maxlength="160" required /></label>
      <label class="f">{{ t('gare.prova.numero') }}<input v-model.number="n.provaNumero" type="number" min="1" class="fl-mono" required /></label>
      <label class="f">{{ t('gare.prova.data') }}<input v-model="n.data" type="date" class="fl-mono" required /></label>
      <label class="f sm:col-span-2">{{ t('gare.prova.campo') }}<input v-model="n.campoDiGara" maxlength="160" /></label>
      <p v-if="errore" class="error-msg sm:col-span-2" role="alert">{{ errore }}</p>
      <div class="sm:col-span-2 flex gap-2"><button class="btn btn-primary">{{ t('gare.crea') }}</button><button type="button" class="btn btn-ghost" @click="nuova = false">{{ t('common.cancel') }}</button></div>
    </form>

    <div v-if="caricamento" class="state-center"><div class="m-spinner"></div></div>
    <p v-else-if="!prove.length" class="state-empty">{{ t('gare.nessunaProva') }}</p>
    <ul v-else class="grid gap-3">
      <li v-for="p in prove" :key="p._id">
        <RouterLink :to="`/gare/${p._id}`" class="card block">
          <div class="flex items-start justify-between gap-2">
            <div><h3 class="font-display text-lg">{{ p.manifestazione }} · {{ t('gare.provaN', { n: p.provaNumero }) }}</h3>
              <p class="text-sm text-muted">{{ p.campoDiGara || '—' }} · <span class="fl-mono">{{ new Date(p.data).toLocaleDateString('it-IT') }}</span></p></div>
            <span class="badge" :class="p.ruolo === 'organizer' ? 'badge-ocean' : 'badge-sand'">{{ t(`gare.ruolo.${p.ruolo}`) }}</span>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '../../components/PageHeader.vue'
import { fipsasApi } from '../../composables/useFipsas.js'

const { t } = useI18n()
const router = useRouter()
const prove = ref([]), caricamento = ref(true), nuova = ref(false), errore = ref('')
const n = reactive({ manifestazione: '', provaNumero: 1, data: new Date().toISOString().slice(0, 10), campoDiGara: '' })
onMounted(async () => { try { prove.value = await fipsasApi.list() } finally { caricamento.value = false } })
async function crea() {
  errore.value = ''
  try { const p = await fipsasApi.create({ ...n }); router.push(`/gare/${p._id}/prova`) } catch (e) { errore.value = e.response?.data?.error || t('common.error') }
}
</script>

<style scoped>
.f { display: grid; gap: 4px; font-size: 12px; color: rgb(var(--color-muted)); } .f input { min-height: 44px; }
.state-empty { padding: 24px; text-align: center; color: rgb(var(--color-muted)); border: 1px dashed rgb(var(--color-border)); border-radius: 16px; }
</style>
