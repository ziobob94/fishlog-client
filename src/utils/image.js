// Ridimensiona e comprime le foto prima dell'upload: le foto da iPhone pesano
// diversi MB e superano il limite del reverse proxy (HTTP 413).
// Configurazione (variabili d'ambiente Vite, con valori di default):
//   VITE_IMAGE_COMPRESS=false     disattiva la compressione
//   VITE_IMAGE_MAX_SIDE=1920      lato lungo massimo in px
//   VITE_IMAGE_QUALITY=0.8        qualità JPEG (0-1)
//   VITE_IMAGE_SKIP_BELOW_KB=800  i JPEG più piccoli (e già entro il lato massimo) restano invariati
const env = import.meta.env || {}
export const imageConfig = {
  enabled: String(env.VITE_IMAGE_COMPRESS ?? 'true') !== 'false',
  maxSide: Number(env.VITE_IMAGE_MAX_SIDE) || 1920,
  quality: Number(env.VITE_IMAGE_QUALITY) || 0.8,
  skipBelow: (Number(env.VITE_IMAGE_SKIP_BELOW_KB) || 800) * 1024,
}
const SKIP_BELOW = imageConfig.skipBelow

export async function compressImage(file, { maxSide = imageConfig.maxSide, quality = imageConfig.quality } = {}) {
  if (!imageConfig.enabled) return file
  if (!file || !file.type?.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    if (scale === 1 && file.size < SKIP_BELOW && file.type === 'image/jpeg') { bmp.close?.(); return file }
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
    bmp.close?.()
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob || (blob.size >= file.size && file.type === 'image/jpeg')) return file
    const name = (file.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

export function compressAll(files) { return Promise.all([...files].map(f => compressImage(f))) }

export function uploadErrorMessage(e, t) {
  if (e?.response?.status === 413) return t('common.fileTooLarge')
  if (e?.code === 'ECONNABORTED') return t('common.uploadTimeout')
  return e?.response?.data?.error || e?.message || t('common.error')
}
