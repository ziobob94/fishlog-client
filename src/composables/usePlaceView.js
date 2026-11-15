// «Guarda un altro luogo» sulla Home: la scheda meteo grande mostra il preferito toccato, e «Torna qui» riporta alla posizione GPS.
// Usato da HomeNowCard (striscia «Stai guardando…») e da FavoritePlaces (tocco sulle schede).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFavoritesStore, HERE_ID } from '../stores/favorites.js'
import { useWeatherStore } from '../stores/weather.js'
import { reverseLabel } from '../utils/places.js'

export function usePlaceView() {
  const { t } = useI18n()
  const fav = useFavoritesStore()
  const weather = useWeatherStore()

  // Scheda attiva: «La mia posizione» se la card grande è sul GPS, altrimenti il preferito con le stesse coordinate.
  const activeId = computed(() => {
    const p = weather.place
    if (!p) return null
    if (p.mode === 'here') return HERE_ID
    return fav.findSame({ lat: p.lat, lon: p.lng })?.id || null
  })
  const viewingName = computed(() => (weather.place && activeId.value !== HERE_ID ? (weather.place.name || t('weather.yourPosition')) : ''))

  async function view(p) {
    weather.pickPlace({ name: p.name, lat: p.lat, lng: p.lon ?? p.lng })
    await weather.load({ force: false })
  }
  async function goHere() {
    if (!(await weather.useHere())) return
    await weather.load({ force: false })
    const p = weather.place
    if (p && !p.name) { try { weather.setName(await reverseLabel(p.lat, p.lng)) } catch { /* resta «La tua posizione» */ } }
  }
  return { activeId, viewingName, view, goHere }
}
