<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay">
      <div class="dialog card">
        <h3>{{ t('marketSurvey.title') }}</h3>
        <p class="text-muted text-sm mt-1">{{ t('marketSurvey.hint') }}</p>

        <div class="form-group mt-3">
          <label>{{ t('marketSurvey.techniqueLabel') }}</label>
          <select v-model="technique">
            <option value="">{{ t('marketSurvey.techniquePlaceholder') }}</option>
            <option v-for="tch in TECHNIQUES" :key="tch.v" :value="tch.v">{{ tch.l }}</option>
          </select>
        </div>

        <div class="form-group mt-3">
          <label>{{ t('marketSurvey.categoriesLabel') }}</label>
          <div class="category-grid">
            <label v-for="c in categories" :key="c" class="category-check">
              <input v-model="selectedCategories" type="checkbox" :value="c" />
              {{ t(`market.categories.${c}`) }}
            </label>
          </div>
        </div>

        <p v-if="error" class="error-msg mt-2">{{ error }}</p>

        <div class="dialog-actions">
          <button class="btn btn-ghost btn-sm" :disabled="saving" @click="skip">{{ t('marketSurvey.skip') }}</button>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="save">
            {{ saving ? t('profile.account.saving') : t('marketSurvey.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.js'
import { useMarketStore } from '../stores/market.js'

const { t }    = useI18n()
const auth     = useAuthStore()
const market   = useMarketStore()

const TECHNIQUES = [
  { v: 'surfcasting', l: 'Surfcasting' }, { v: 'feeder', l: 'Feeder' },
  { v: 'spinning', l: 'Spinning' }, { v: 'bolentino', l: 'Bolentino' },
  { v: 'mosca', l: 'Mosca' }, { v: 'altro', l: 'Altro' }
]

const visible = computed(() => !!auth.isLoggedIn && !!auth.user && !auth.user.marketPreferences?.surveyCompleted)
const categories = computed(() => market.categories)

const technique = ref('')
const selectedCategories = ref([])
const saving = ref(false)
const error  = ref('')

onMounted(() => {
  if (!market.categories.length) market.fetchCategories()
})

async function submit(isSkip) {
  error.value = ''
  saving.value = true
  try {
    await auth.updateMarketPreferences({
      technique:  isSkip ? '' : technique.value,
      categories: isSkip ? [] : selectedCategories.value
    })
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error')
  } finally {
    saving.value = false
  }
}

function skip() { submit(true) }
function save() { submit(false) }
</script>

<style scoped>
.dialog-overlay { @apply fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4; }
.dialog         { @apply max-w-sm w-full; }

.category-grid  { @apply grid grid-cols-2 gap-2 mt-1; }
.category-check { @apply flex items-center gap-2 text-sm; }

.error-msg { @apply bg-danger/10 border border-danger rounded-sm text-danger text-xs px-2.5 py-1.5; }

.dialog-actions { @apply flex justify-end gap-2 mt-4; }
</style>
