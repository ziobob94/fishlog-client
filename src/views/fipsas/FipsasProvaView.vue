<template>
  <div>
    <PageHeader :title="titolo" back="/gare" />
    <div v-if="caricamento" class="state-center"><div class="m-spinner"></div></div>
    <p v-else-if="errore" class="error-msg" role="alert">{{ errore }}</p>
    <template v-else-if="prova">
      <p class="text-sm text-muted mb-3">{{ prova.campoDiGara }} · <span class="fl-mono">{{ new Date(prova.data).toLocaleDateString('it-IT') }}</span>
        · <span class="badge badge-ocean">{{ t(`gare.ruolo.${prova.ruolo}`) }}</span><span v-if="prova.isJudge && prova.ruolo !== 'judge'" class="badge badge-sand ml-1">{{ t('gare.ruolo.judge') }}</span></p>

      <nav role="tablist" :aria-label="t('gare.titolo')" class="tabs" @keydown="frecce">
        <button v-for="s in sezioni" :id="`tab-${s}`" :key="s" type="button" role="tab" class="tab" :class="{ on: sezione === s }"
          :aria-selected="sezione === s" :aria-controls="'pannello'" :tabindex="sezione === s ? 0 : -1" @click="vai(s)">{{ t(`gare.tab.${s}`) }}</button>
      </nav>

      <div id="pannello" role="tabpanel" :aria-labelledby="`tab-${sezione}`" tabindex="0" class="mt-4">
        <ProvaPanel v-if="sezione === 'prova'" :prova="prova" @aggiornata="aggiorna" @duplica="duplica" />
        <IscrittiPanel v-else-if="sezione === 'iscritti'" :prova="prova" @cambiato="ricarica" />
        <SorteggioPanel v-else-if="sezione === 'sorteggio'" :prova="prova" @cambiato="ricarica" />
        <PesaturaPanel v-else-if="sezione === 'pesatura'" :prova="prova" @cambiato="onCambio" />
        <ClassificheTabelle v-else-if="sezione === 'classifiche' && classifiche" :data="classifiche" :titoli="prova.titoli || {}" />
        <StampaPanel v-else-if="sezione === 'stampa'" :prova="prova" @aggiornata="aggiorna" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '../../components/PageHeader.vue'
import ProvaPanel from '../../components/fipsas/ProvaPanel.vue'
import IscrittiPanel from '../../components/fipsas/IscrittiPanel.vue'
import SorteggioPanel from '../../components/fipsas/SorteggioPanel.vue'
import PesaturaPanel from '../../components/fipsas/PesaturaPanel.vue'
import ClassificheTabelle from '../../components/fipsas/ClassificheTabelle.vue'
import StampaPanel from '../../components/fipsas/StampaPanel.vue'
import { fipsasApi } from '../../composables/useFipsas.js'

const { t } = useI18n()
const route = useRoute(), router = useRouter()
const sezioni = ['prova', 'iscritti', 'sorteggio', 'pesatura', 'classifiche', 'stampa']
const sezione = computed(() => (sezioni.includes(route.params.sezione) ? route.params.sezione : 'prova'))
const prova = ref(null), classifiche = ref(null), caricamento = ref(true), errore = ref('')
const titolo = computed(() => (prova.value ? `${prova.value.manifestazione} · ${t('gare.provaN', { n: prova.value.provaNumero })}` : t('gare.titolo')))

async function ricarica() { prova.value = await fipsasApi.get(route.params.id) }
const aggiorna = async (p) => { prova.value = { ...(prova.value || {}), ...p }; await ricarica() }
const onCambio = () => { classifiche.value = null }
async function caricaClassifiche() { if (sezione.value === 'classifiche') classifiche.value = await fipsasApi.classifiche(route.params.id) }
onMounted(async () => {
  try { await ricarica(); await caricaClassifiche() } catch (e) { errore.value = e.response?.status === 404 ? t('gare.nonTrovata') : t('common.error') } finally { caricamento.value = false }
})
watch(sezione, caricaClassifiche)
const vai = (s) => router.replace(`/gare/${route.params.id}/${s}`)
async function duplica() { const p = await fipsasApi.duplica(route.params.id); router.push(`/gare/${p._id}/prova`).then(() => location.reload()) }
function frecce(e) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  const i = sezioni.indexOf(sezione.value)
  vai(sezioni[(i + (e.key === 'ArrowRight' ? 1 : -1) + sezioni.length) % sezioni.length])
  e.preventDefault()
  queueMicrotask(() => e.currentTarget.querySelector('[aria-selected=true]')?.focus())
}
</script>

<style scoped>
.tabs { display: flex; gap: 6px; overflow-x: auto; border-bottom: 1px solid rgb(var(--color-border)); padding-bottom: 6px; }
.tab { min-height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid rgb(var(--color-border)); font-size: 14px; font-weight: 600; white-space: nowrap; color: rgb(var(--color-foam)); transition: background var(--motion-fast, 120ms), color var(--motion-fast, 120ms); }
.tab.on { background: rgb(var(--color-ocean)); color: rgb(var(--color-on-primary)); border-color: rgb(var(--color-ocean)); }
.tab:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
</style>
