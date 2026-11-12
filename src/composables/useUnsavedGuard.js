// «Uscire senza salvare?»: blocca l'uscita dalla pagina (router e chiusura scheda) finché ci sono modifiche.
import { onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { confirmDialog } from './useConfirm.js'

export function useUnsavedGuard(isDirty) {
  const { t } = useI18n()
  let bypass = false
  onBeforeRouteLeave(async () => {
    if (bypass || !isDirty()) return true
    return confirmDialog(t('unsaved.message'), { title: t('unsaved.title'), confirmLabel: t('unsaved.leave'), cancelLabel: t('unsaved.stay') })
  })
  const onUnload = e => { if (!bypass && isDirty()) { e.preventDefault(); e.returnValue = '' } }
  onMounted(() => window.addEventListener('beforeunload', onUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onUnload))
  return { allowLeave() { bypass = true } }
}
