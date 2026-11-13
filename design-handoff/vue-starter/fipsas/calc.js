// Calcoli delle classifiche FIPSAS (surf casting), come osservati nelle classifiche di esempio.
// Funzioni pure, senza dipendenze: da portare in TypeScript nel client e nel server.
// Regole verificate sui PDF (vedi calc.test.mjs): penalità di settore, ordine della giornata.
// Regole DA CONFERMARE con il regolamento: spareggio progressiva, riserve di squadra, bonus per catture valide.

/** Posti con media sugli ex aequo. valori: number[]; desc=true → il valore più alto è il 1º posto. */
export function rankAvg(valori, desc = true) {
  const idx = valori.map((_, i) => i).sort((a, b) => (desc ? valori[b] - valori[a] : valori[a] - valori[b]));
  const out = new Array(valori.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && valori[idx[j + 1]] === valori[idx[i]]) j++;
    const posto = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k++) out[idx[k]] = posto;
    i = j + 1;
  }
  return out;
}

/** Punteggio effettivo = conversione del peso + bonus. */
export const punteggio = (c) => c.conversione + c.bonus;

/** Penalità di settore: posto per punteggio decrescente (ex aequo = media); zero catture = n + 1 (cappotto). */
export function penalitaSettore(concorrenti) {
  const n = concorrenti.length;
  const posti = rankAvg(concorrenti.map((c) => c.punteggio ?? punteggio(c)));
  return concorrenti.map((c, i) => (c.catture === 0 ? n + 1 : posti[i]));
}

/** Classifica di giornata: penalità crescente, poi punteggio decrescente. */
export const classificaGiornata = (righe) =>
  [...righe].sort((a, b) => a.penalita - b.penalita || b.punteggio - a.punteggio);

/** Progressiva individuale: somma dei piazzamenti; spareggio (da confermare): migliori piazzamenti, poi punteggio totale. */
export function classificaProgressiva(concorrenti) {
  const k = (c) => {
    const p = c.prove.map((x) => x.penalita);
    return { tot: p.reduce((s, x) => s + x, 0), ord: [...p].sort((a, b) => a - b), pt: c.prove.reduce((s, x) => s + x.punteggio, 0) };
  };
  return [...concorrenti].sort((a, b) => {
    const A = k(a), B = k(b);
    if (A.tot !== B.tot) return A.tot - B.tot;
    for (let i = 0; i < A.ord.length; i++) if (A.ord[i] !== B.ord[i]) return A.ord[i] - B.ord[i];
    return B.pt - A.pt;
  });
}

/** Progressiva a squadre: penalità di prova = somma dei posti di settore dei componenti (4, le riserve non contano). */
export function classificaSquadre(squadre, componentiPerSquadra = 4) {
  const righe = squadre.map((s) => {
    const membri = s.componenti.slice(0, componentiPerSquadra);
    const penProve = s.prove.map((_, k) => membri.reduce((t, m) => t + m.prove[k].penalita, 0));
    const peso = membri.reduce((t, m) => t + m.prove.reduce((x, p) => x + p.punteggio, 0), 0);
    return { ...s, penProve, penTot: penProve.reduce((a, b) => a + b, 0), peso };
  });
  return righe.sort((a, b) => a.penTot - b.penTot || b.peso - a.peso);
}
