// Stessa regola del server (fishlog-server/src/utils/hashtags.js): "#" + lettere/cifre/_,
// (senza lookbehind: Safari < 16.4 lo rifiuta e romperebbe il caricamento del modulo) non attaccato a una parola o a un url ("a#b", "x.it/a#b" non sono tag), non solo cifre.
const HASHTAG_RE = /(^|[^\p{L}\p{N}_&/#])#([\p{L}\p{N}_]{1,50})/gu

export function normalizeTag(tag) {
  return String(tag ?? '').replace(/^#/, '').normalize('NFC').toLocaleLowerCase('it')
}

// Spezza il testo in pezzi { text } e { text, tag } (tag normalizzato) senza mai produrre HTML.
export function splitHashtags(text) {
  const src = String(text ?? '')
  const parts = []
  let last = 0
  for (const m of src.matchAll(HASHTAG_RE)) {
    const tag = normalizeTag(m[2])
    if (!/\p{L}|_/u.test(tag)) continue
    const start = m.index + m[1].length
    if (start > last) parts.push({ text: src.slice(last, start) })
    parts.push({ text: `#${m[2]}`, tag })
    last = start + 1 + m[2].length
  }
  if (last < src.length) parts.push({ text: src.slice(last) })
  return parts
}
