// Stessa regola del server (fishlog-server/src/utils/hashtags.js): "#" + lettere/cifre/_,
// non attaccato a una parola o a un url ("a#b", "x.it/a#b" non sono tag), non solo cifre.
const HASHTAG_RE = /(?<![\p{L}\p{N}_&/#])#([\p{L}\p{N}_]{1,50})/gu

export function normalizeTag(tag) {
  return String(tag ?? '').replace(/^#/, '').normalize('NFC').toLocaleLowerCase('it')
}

// Spezza il testo in pezzi { text } e { text, tag } (tag normalizzato) senza mai produrre HTML.
export function splitHashtags(text) {
  const src = String(text ?? '')
  const parts = []
  let last = 0
  for (const m of src.matchAll(HASHTAG_RE)) {
    const tag = normalizeTag(m[1])
    if (!/\p{L}|_/u.test(tag)) continue
    if (m.index > last) parts.push({ text: src.slice(last, m.index) })
    parts.push({ text: m[0], tag })
    last = m.index + m[0].length
  }
  if (last < src.length) parts.push({ text: src.slice(last) })
  return parts
}
