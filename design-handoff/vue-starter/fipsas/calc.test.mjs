// Esegui con: node calc.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { penalitaSettore, punteggio, classificaGiornata } from './calc.js';
const fx = JSON.parse(readFileSync(new URL('./fixture-prova3.json', import.meta.url)));
// 1) punteggio = conversione + bonus (60 righe)
for (const c of fx.concorrenti) assert.equal(punteggio(c), c.punteggio, `punteggio gara ${c.gara}`);
// 2) penalità di settore uguali a quelle del PDF (60 righe, 6 settori)
for (const s of 'ABCDEF') {
  const rs = fx.concorrenti.filter((c) => c.settore === s);
  const pen = penalitaSettore(rs);
  rs.forEach((c, i) => assert.equal(pen[i], c.penalita, `settore ${s}, gara ${c.gara}`));
}
// 3) ex aequo e cappotto
assert.deepEqual(penalitaSettore([{ punteggio: 500, catture: 3 }, { punteggio: 500, catture: 3 }, { punteggio: 100, catture: 1 }, { punteggio: 0, catture: 0 }]), [1.5, 1.5, 3, 5]);
// 4) ordine di giornata
const g = classificaGiornata([{ penalita: 2, punteggio: 900 }, { penalita: 1, punteggio: 100 }, { penalita: 2, punteggio: 950 }]);
assert.deepEqual(g.map((r) => r.punteggio), [100, 950, 900]);
console.log('FIPSAS calc: ok');
