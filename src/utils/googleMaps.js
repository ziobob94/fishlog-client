let loadPromise = null

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places`
    script.async = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Impossibile caricare Google Maps'))
    document.head.appendChild(script)
  })

  return loadPromise
}
