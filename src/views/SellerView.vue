<template>
  <div class="seller">
    <div class="page-header">
      <RouterLink to="/market" class="btn btn-ghost btn-sm">{{ t('common.back') }}</RouterLink>
      <span v-if="status === 'verified'" class="badge badge-success icon-inline"><AppIcon name="verificato" :size="14" /> {{ t('seller.verified') }}</span>
    </div>

    <!-- 2 · Stato della verifica: in revisione -->
    <section v-if="status === 'pending'" class="panel panel-sand">
      <h1>{{ t('seller.pending.title') }}</h1>
      <p class="text-muted">{{ t('seller.pending.text') }}</p>
      <p class="notice">{{ t('seller.pending.noPublish') }}</p>
      <RouterLink to="/market" class="btn btn-secondary mt-3">{{ t('seller.backToMarket') }}</RouterLink>
    </section>

    <!-- 1 · Richiesta (anche dopo un rifiuto: «Modifica e reinvia») -->
    <form v-else-if="status !== 'verified'" class="flow" @submit.prevent="submitRequest">
      <h1>{{ t('seller.title') }}</h1>

      <div v-if="status === 'rejected'" class="panel panel-danger" role="alert">
        <h2>{{ t('seller.rejected.title') }}</h2>
        <p v-if="auth.user?.shop?.rejectionReason">{{ t('seller.rejected.reason') }} <strong>{{ auth.user.shop.rejectionReason }}</strong></p>
        <p class="text-muted text-sm">{{ t('seller.rejected.hint') }}</p>
      </div>

      <div class="panel">
        <h2 class="icon-inline"><AppIcon name="verificato" :size="20" /> {{ t('seller.intro.title') }}</h2>
        <p class="text-muted">{{ t('seller.intro.text') }}</p>
        <ol class="steps">
          <li v-for="n in 3" :key="n"><span class="step-n">{{ n }}</span> {{ t(`seller.intro.step${n}`) }}</li>
        </ol>
      </div>

      <fieldset class="who">
        <legend>{{ t('seller.who') }}</legend>
        <label v-for="k in ['privato', 'negozio']" :key="k" class="who-option" :class="{ active: form.sellerType === k }">
          <input v-model="form.sellerType" type="radio" name="sellerType" :value="k" class="sr-only" />
          <strong>{{ t(`seller.type.${k}.name`) }}</strong>
          <span class="text-muted text-xs">{{ t(`seller.type.${k}.hint`) }}</span>
        </label>
      </fieldset>

      <h2 class="section-label">{{ t('seller.business') }}</h2>
      <div class="form-group">
        <label for="s-legal">{{ form.sellerType === 'negozio' ? t('seller.legalName') : t('seller.fullName') }}</label>
        <input id="s-legal" v-model="form.legalName" type="text" required autocomplete="organization" />
      </div>
      <div v-if="form.sellerType === 'negozio'" class="form-group">
        <label for="s-vat">{{ t('seller.vat') }}</label>
        <input id="s-vat" v-model="form.vatNumber" type="text" inputmode="numeric" maxlength="11" pattern="[0-9]{11}" :placeholder="t('seller.vatPlaceholder')" required />
      </div>
      <div class="form-group">
        <label for="s-city">{{ t('seller.city') }}</label>
        <input id="s-city" v-model="form.city" type="text" required autocomplete="address-level2" />
      </div>
      <div class="form-group">
        <label for="s-phone">{{ t('seller.phone') }}</label>
        <input id="s-phone" v-model="form.phone" type="tel" placeholder="+39 ..." required autocomplete="tel" />
      </div>
      <div class="form-group">
        <label for="s-doc">{{ t('seller.document.label') }}</label>
        <input id="s-doc" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" :required="!hasDocument" @change="onFile" />
        <p class="text-muted text-xs mt-1">
          {{ hasDocument && !docFile ? t('seller.document.already') : t('seller.document.hint') }}
        </p>
      </div>

      <label class="check-row">
        <input v-model="confirmed" type="checkbox" required />
        <span>{{ t('seller.confirm') }}</span>
      </label>

      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary w-full" :disabled="saving || !confirmed">
        {{ status === 'rejected' ? t('seller.resubmit') : t('seller.submit') }}
      </button>
    </form>

    <!-- 3 · Configura il negozio (solo dopo l'approvazione) -->
    <form v-else class="flow" @submit.prevent="saveShop">
      <h1>{{ t('seller.shop.title') }}</h1>
      <p class="text-muted">{{ t('seller.shop.intro') }}</p>

      <div class="logo-row">
        <img v-if="logoPreview || auth.user.shop.logo" :src="logoPreview || auth.user.shop.logo" class="logo-box" alt="" />
        <span v-else class="logo-box logo-empty"><AppIcon name="foto" :size="24" /></span>
        <div>
          <label for="sh-logo" class="btn btn-secondary btn-sm logo-btn">{{ t('seller.shop.uploadLogo') }}</label>
          <input id="sh-logo" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onLogo" />
          <p class="text-muted text-xs mt-1">{{ t('seller.shop.logoHint') }}</p>
        </div>
      </div>

      <div class="form-group">
        <label for="sh-name">{{ t('seller.shop.name') }}</label>
        <input id="sh-name" v-model="shop.name" type="text" required />
        <p class="text-muted text-xs mt-1">{{ t('seller.shop.nameHint') }}</p>
      </div>
      <div class="form-group">
        <label for="sh-desc">{{ t('seller.shop.description') }}</label>
        <textarea id="sh-desc" v-model="shop.description" rows="3"></textarea>
      </div>

      <div class="panel readonly">
        <p class="text-muted text-xs">{{ t('seller.shop.legalTitle') }}</p>
        <p><strong>{{ auth.user.shop.legalName }}<template v-if="auth.user.shop.vatNumber"> · {{ auth.user.shop.vatNumber }}</template></strong></p>
        <p class="text-muted text-xs">{{ t('seller.shop.legalHint') }}</p>
      </div>

      <div class="form-group">
        <label for="sh-web">{{ t('seller.shop.website') }}</label>
        <input id="sh-web" v-model="shop.website" type="url" placeholder="www.tuonegozio.it" />
      </div>
      <div class="form-group">
        <label for="sh-city">{{ t('seller.city') }}</label>
        <input id="sh-city" v-model="shop.city" type="text" />
      </div>

      <fieldset class="checks">
        <legend>{{ t('seller.shop.delivery') }}</legend>
        <label v-for="d in ['ritiro', 'spedizione']" :key="d" class="check-row" :class="{ active: shop.delivery.includes(d) }">
          <input v-model="shop.delivery" type="checkbox" :value="d" />
          <span>{{ t(`seller.shop.deliveryOptions.${d}`) }}</span>
        </label>
      </fieldset>

      <div class="form-group">
        <label for="sh-contact">{{ t('seller.shop.contact') }}</label>
        <input id="sh-contact" v-model="shop.contact" type="text" />
      </div>

      <div class="panel panel-sand site-card">
        <h2 class="icon-inline"><AppIcon name="mappamondo" :size="20" /> {{ t('seller.site.title') }}</h2>
        <p class="text-muted">{{ t('seller.site.text') }}</p>
        <p v-if="siteDone === true" class="success-msg">{{ t('seller.site.thanks') }}</p>
        <div v-else class="site-actions">
          <button type="button" class="btn btn-primary w-full" :disabled="siteBusy" @click="siteRequest(true)">{{ t('seller.site.yes') }}</button>
          <button type="button" class="btn btn-ghost w-full" :disabled="siteBusy" @click="siteRequest(false)">{{ t('seller.site.no') }}</button>
        </div>
      </div>

      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>
      <p v-if="saved" class="success-msg">{{ t('common.save') }} ✓</p>
      <button type="submit" class="btn btn-primary w-full" :disabled="saving">{{ t('seller.shop.saveAndPublish') }}</button>
      <button type="button" class="btn btn-ghost w-full" :disabled="saving" @click="saveShop(false)">{{ t('seller.shop.saveAndBack') }}</button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '../components/AppIcon.vue'
import { useAuthStore } from '../stores/auth.js'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const status = computed(() => auth.user?.shop?.verificationStatus || 'none')
const s0 = auth.user?.shop || {}

const form = ref({
  sellerType: s0.sellerType || 'negozio', legalName: s0.legalName || '', vatNumber: s0.vatNumber || '',
  city: s0.city || '', phone: s0.phone || ''
})
const shop = ref({
  name: s0.name || '', description: s0.description || '', website: s0.website || '',
  city: s0.city || '', delivery: [...(s0.delivery || [])], contact: s0.contact || ''
})
const confirmed = ref(false)
const docFile = ref(null)
const hasDocument = computed(() => !!auth.user?.shop?.documentUploaded)
const logoFile = ref(null)
const logoPreview = ref('')
function onLogo(e) {
  const f = e.target.files?.[0]
  if (!f) return
  logoFile.value = f
  logoPreview.value = URL.createObjectURL(f)
}
function onFile(e) { docFile.value = e.target.files?.[0] || null }
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const siteBusy = ref(false)
const siteDone = ref(s0.siteRequested ? true : null)

async function submitRequest() {
  saving.value = true; error.value = ''
  try {
    const payload = { enabled: true, ...form.value }
    if (payload.sellerType === 'privato') payload.vatNumber = ''
    if (docFile.value) await auth.uploadShopDocument(docFile.value)
    await auth.updateShop(payload)
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error')
  } finally { saving.value = false }
}

async function saveShop(publish = true) {
  saving.value = true; error.value = ''; saved.value = false
  try {
    if (logoFile.value) await auth.uploadShopLogo(logoFile.value)
    await auth.updateShop({ ...shop.value })
    saved.value = true
    router.push(publish === false ? '/market' : '/market/new')
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error')
  } finally { saving.value = false }
}

async function siteRequest(requested) {
  siteBusy.value = true
  try {
    await auth.requestShopSite(requested)
    siteDone.value = requested ? true : null
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error')
  } finally { siteBusy.value = false }
}
</script>

<style scoped>
.seller { @apply max-w-xl mx-auto; }
.page-header { @apply flex items-center justify-between mb-4; }
.flow { @apply flex flex-col gap-4; }
.icon-inline { @apply inline-flex items-center gap-2; }
.panel { @apply bg-surface border border-border/60 rounded-xl p-4 flex flex-col gap-2; }
.panel-sand { @apply border-sand/50; background: rgb(var(--color-sand) / 0.08); }
.panel-danger { @apply border-danger/60; background: rgb(var(--color-danger) / 0.08); }
.panel h2 { @apply text-lg; }
.notice { @apply text-sm text-muted bg-surface-2 rounded-sm px-3 py-2; }
.steps { @apply list-none flex flex-col gap-2 mt-1; }
.steps li { @apply flex items-center gap-3 text-sm; }
.step-n { @apply inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-2 text-xs font-bold shrink-0; }
.steps li:first-child .step-n { @apply bg-ocean text-on-primary; }
.section-label { @apply text-xs font-bold uppercase text-muted; letter-spacing: 0.14em; }
.who { @apply grid grid-cols-2 gap-3 border-0; }
.who legend, .checks legend { @apply text-xs font-bold uppercase text-muted mb-2; letter-spacing: 0.14em; }
.who-option { @apply flex flex-col gap-0.5 normal-case p-3 rounded-lg border-2 border-border bg-surface cursor-pointer text-foam min-h-[44px]; letter-spacing: 0; font-size: 1rem; }
.who-option.active { @apply border-ocean; background: var(--ocean-glow); }
.who-option:focus-within { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.checks { @apply flex flex-col gap-2 border-0; }
.check-row { @apply flex items-center gap-3 normal-case text-foam text-sm p-3 rounded-lg border border-border bg-surface cursor-pointer min-h-[44px]; letter-spacing: 0; font-weight: 600; }
.check-row.active { @apply border-ocean; background: var(--ocean-glow); }
.check-row input { @apply w-5 h-5 shrink-0; }
.readonly p { @apply m-0; }
.logo-row { @apply flex items-center gap-4; }
.logo-box { @apply w-20 h-20 shrink-0 rounded-xl object-cover border-2 border-dashed border-ocean/60 flex items-center justify-center text-ocean-text; background: var(--ocean-glow); }
.logo-btn { @apply cursor-pointer; letter-spacing: 0; text-transform: none; }
.site-actions { @apply flex flex-col gap-2 mt-1; }
.success-msg { @apply text-success-text text-sm; }
.sr-only { @apply absolute w-px h-px overflow-hidden; clip: rect(0 0 0 0); }
</style>
