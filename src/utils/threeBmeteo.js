// Link a 3bmeteo (solo un collegamento esterno: nessun dato, widget, iframe, scraping o logo dentro FishLog).
//
// Deep link: 3bmeteo ha pagine per località con indirizzo `https://www.3bmeteo.com/meteo/<località>` (verificato con
// una ricerca, es. /meteo/senigallia), ma NON offre un servizio pubblico che da coordinate o nome di un luogo
// (anche preso da Google Places) restituisca l'indirizzo giusto. Inventare lo slug dal nome porterebbe a 404 o a
// una località omonima sbagliata, quindi per ora si apre la home. Quando esisterà una fonte affidabile dello slug
// (es. un campo salvato sul luogo) basta restituirlo qui: tutti i componenti usano questa funzione.
export const THREEBMETEO_HOME = 'https://www.3bmeteo.com/'

export function threeBmeteoUrl(/* place */) {
  return THREEBMETEO_HOME
}
