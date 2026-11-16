// Ridimensiona e converte in WebP compresso le foto prima dell'upload: le foto
// da iPhone (anche HEIC, dove il browser le decodifica) pesano diversi MB e
// superano il limite del reverse proxy (HTTP 413). Se il browser non sa
// codificare WebP si ricade su JPEG.
// Configurazione (variabili d'ambiente Vite, con valori di default):
//   VITE_IMAGE_COMPRESS=false     disattiva la compressione
//   VITE_IMAGE_MAX_SIDE=1920      lato lungo massimo in px
//   VITE_IMAGE_QUALITY=0.8        qualità WebP/JPEG (0-1)
const env = import.meta.env || {}
export const imageConfig = {
  enabled: String(env.VITE_IMAGE_COMPRESS ?? 'true') !== 'false',
  maxSide: Number(env.VITE_IMAGE_MAX_SIDE) || 1920,
  quality: Number(env.VITE_IMAGE_QUALITY) || 0.8,
}

export async function compressImage(file, { maxSide = imageConfig.maxSide, quality = imageConfig.quality } = {}) {
  if (!imageConfig.enabled) return file
  if (!file || !file.type?.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
    bmp.close?.()
    let blob = await new Promise(res => canvas.toBlob(res, 'image/webp', quality))
    // Safari vecchi ignorano il tipo richiesto e restituiscono PNG: meglio JPEG.
    if (blob && blob.type !== 'image/webp') blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob) return file
    // Un WebP/JPEG già più piccolo e entro il lato massimo resta com'è.
    if (scale === 1 && blob.size >= file.size && (file.type === 'image/webp' || file.type === 'image/jpeg')) return file
    const ext = blob.type === 'image/webp' ? '.webp' : '.jpg'
    const name = (file.name || 'foto').replace(/\.[^.]+$/, '') + ext
    return new File([blob], name, { type: blob.type, lastModified: Date.now() })
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
