// Numeri come nei moduli: virgola per i decimali (posto medio 4,5) e punto delle migliaia (1.285).
export const fmtPos = (n) => (n === null || n === undefined ? '–' : String(n).replace('.', ','))
export const fmtPunti = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('it-IT') : '–')

/** CSV semplice (separatore , o ;): cognome, nome, società, squadra. La prima riga può essere l'intestazione. */
export function leggiCsv(testo) {
  const righe = String(testo || '').split(/\r?\n/).map((r) => r.trim()).filter(Boolean)
  if (!righe.length) return []
  const sep = (righe[0].match(/;/g) || []).length >= (righe[0].match(/,/g) || []).length ? ';' : ','
  const celle = (r) => r.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))
  let rows = righe.map(celle)
  if (/cognome/i.test(rows[0][0])) rows = rows.slice(1)
  return rows.map(([cognome, nome, societa, squadra]) => ({ cognome, nome, societa, squadra }))
}
