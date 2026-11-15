// Generatore di codici QR (modalità byte, correzione errori M, versioni 1-10: fino a 213 byte). Nessuna dipendenza.
// Algoritmo come da ISO/IEC 18004. Restituisce la matrice di moduli o un SVG pronto da mostrare.

const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]   // livello M, per versione
const NUM_BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5]
const MAX_VERSION = 10

// Aritmetica di Reed-Solomon su GF(256), polinomio 0x11D.
function gfMul(x, y) {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D)
    z ^= ((y >>> i) & 1) * x
  }
  return z
}
function rsDivisor(degree) {
  const r = new Array(degree).fill(0)
  r[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = gfMul(r[j], root)
      if (j + 1 < r.length) r[j] ^= r[j + 1]
    }
    root = gfMul(root, 0x02)
  }
  return r
}
function rsRemainder(data, divisor) {
  const r = divisor.map(() => 0)
  for (const b of data) {
    const f = b ^ r.shift()
    r.push(0)
    divisor.forEach((c, i) => { r[i] ^= gfMul(c, f) })
  }
  return r
}

function rawDataModules(ver) {
  let r = (16 * ver + 128) * ver + 64
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2
    r -= (25 * n - 10) * n - 55
    if (ver >= 7) r -= 36
  }
  return r
}
const dataCodewords = ver => Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver]

function alignmentPositions(ver) {
  if (ver === 1) return []
  const n = Math.floor(ver / 7) + 2
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2
  const res = [6]
  for (let pos = ver * 4 + 10; res.length < n; pos -= step) res.splice(1, 0, pos)
  return res
}

function bchFormat(data) {
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return ((data << 10) | rem) ^ 0x5412
}
function bchVersion(ver) {
  let rem = ver
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25)
  return (ver << 12) | rem
}

function utf8(text) { return [...new TextEncoder().encode(text)] }

function encodeData(bytes, ver) {
  const bits = []
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1) }
  push(0x4, 4)                            // modalità byte
  push(bytes.length, ver < 10 ? 8 : 16)   // lunghezza
  bytes.forEach(b => push(b, 8))
  const cap = dataCodewords(ver) * 8
  push(0, Math.min(4, cap - bits.length))
  push(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) push(pad, 8)
  const out = []
  for (let i = 0; i < bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8).join(''), 2))
  return out
}

function addEccAndInterleave(data, ver) {
  const nb = NUM_BLOCKS[ver], ecc = ECC_PER_BLOCK[ver]
  const raw = Math.floor(rawDataModules(ver) / 8)
  const shortBlocks = nb - (raw % nb)
  const shortLen = Math.floor(raw / nb)
  const div = rsDivisor(ecc)
  const blocks = []
  for (let i = 0, k = 0; i < nb; i++) {
    const len = shortLen - ecc + (i < shortBlocks ? 0 : 1)
    const dat = data.slice(k, k + len)
    k += len
    const e = rsRemainder(dat, div)
    if (i < shortBlocks) dat.push(0)
    blocks.push(dat.concat(e))
  }
  const out = []
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((b, j) => { if (i !== shortLen - ecc || j >= shortBlocks) out.push(b[i]) })
  }
  return out
}

// Matrice di moduli (true = scuro) per un testo.
export function qrMatrix(text) {
  const bytes = utf8(String(text))
  let ver = 1
  while (ver <= MAX_VERSION && bytes.length + 2 > dataCodewords(ver)) ver++
  if (ver > MAX_VERSION) throw new Error('Testo troppo lungo per il QR')
  const size = ver * 4 + 17
  const mods = Array.from({ length: size }, () => new Array(size).fill(false))
  const fn = Array.from({ length: size }, () => new Array(size).fill(false))
  const set = (x, y, dark) => { mods[y][x] = dark; fn[y][x] = true }

  // pattern di temporizzazione
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0) }
  // pattern di ricerca con separatori
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4)
    }
  }
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4)
  // allineamento
  const ap = alignmentPositions(ver)
  ap.forEach((ax, i) => ap.forEach((ay, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) return
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }))

  const drawFormat = mask => {
    const bits = bchFormat((0 << 3) | mask)   // livello M = 00
    const b = i => ((bits >>> i) & 1) !== 0
    for (let i = 0; i <= 5; i++) set(8, i, b(i))
    set(8, 7, b(6)); set(8, 8, b(7)); set(7, 8, b(8))
    for (let i = 9; i < 15; i++) set(14 - i, 8, b(i))
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, b(i))
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, b(i))
    set(8, size - 8, true)
  }
  drawFormat(0)   // riserva le aree
  if (ver >= 7) {
    const bits = bchVersion(ver)
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) !== 0, a = size - 11 + (i % 3), b = Math.floor(i / 3)
      set(a, b, dark); set(b, a, dark)
    }
  }

  // dati in zig-zag
  const cw = addEccAndInterleave(encodeData(bytes, ver), ver)
  const total = cw.length * 8
  let bit = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert
        if (!fn[y][x] && bit < total) { mods[y][x] = ((cw[bit >>> 3] >>> (7 - (bit & 7))) & 1) !== 0; bit++ }
      }
    }
  }

  // maschere: si sceglie quella con penalità minore
  const masks = [
    (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ]
  let best = null, bestScore = Infinity
  for (let m = 0; m < 8; m++) {
    const g = mods.map(r => r.slice())
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && masks[m](x, y)) g[y][x] = !g[y][x]
    // il formato va scritto sulla copia mascherata
    const saved = mods.map(r => r.slice())
    for (let y = 0; y < size; y++) mods[y] = g[y]
    drawFormat(m)
    const score = penalty(mods)
    if (score < bestScore) { bestScore = score; best = mods.map(r => r.slice()) }
    for (let y = 0; y < size; y++) mods[y] = saved[y]
  }
  return best
}

function penalty(g) {
  const n = g.length
  let r = 0
  const runs = line => {
    let s = 0, run = 1
    for (let i = 1; i <= line.length; i++) {
      if (i < line.length && line[i] === line[i - 1]) run++
      else { if (run >= 5) s += 3 + (run - 5); run = 1 }
    }
    return s
  }
  const finderLike = line => {
    let s = 0
    const str = line.map(v => (v ? '1' : '0')).join('')
    for (const p of ['10111010000', '00001011101']) { let i = -1; while ((i = str.indexOf(p, i + 1)) >= 0) s += 40 }
    return s
  }
  for (let y = 0; y < n; y++) { r += runs(g[y]) + finderLike(g[y]) }
  for (let x = 0; x < n; x++) { const col = g.map(row => row[x]); r += runs(col) + finderLike(col) }
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) if (g[y][x] === g[y][x + 1] && g[y][x] === g[y + 1][x] && g[y][x] === g[y + 1][x + 1]) r += 3
  const dark = g.flat().filter(Boolean).length
  r += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10
  return r
}

// SVG con margine («quiet zone») di 4 moduli.
export function qrSvg(text, { dark = '#000', light = '#fff' } = {}) {
  const m = qrMatrix(text), n = m.length, q = 4
  let d = ''
  m.forEach((row, y) => row.forEach((v, x) => { if (v) d += `M${x + q} ${y + q}h1v1h-1z` }))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + q * 2} ${n + q * 2}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`
}
