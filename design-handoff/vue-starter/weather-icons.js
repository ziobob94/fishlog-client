// Icone del meteo FishLog: griglia 24, tratto 2 px, estremità e angoli arrotondati (come icons.js).
// Uso: <WeatherIcon :code="61" :is-day="false" /> oppure <WeatherIcon name="pressione" />
export const weatherIcons = {
  'sereno': 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2.500v2M12 19.500v2M4.700 4.700l1.400 1.400M17.900 17.900l1.400 1.400M2.500 12h2M19.500 12h2M4.700 19.300l1.400-1.400M17.900 6.100l1.400-1.400',
  'sereno-notte': 'M20 14.500A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500Z',
  'poco-nuvoloso': 'M12 2.500V4M4.600 5.100l1.100 1.100M2.500 11H4M19.400 5.100l-1.100 1.100M21.500 11H20M16.500 11a4.500 4.500 0 0 0-8.300-2.400M8 21h9a3.500 3.500 0 0 0 .4-6.980A5 5 0 0 0 8 15.200 3 3 0 0 0 8 21Z',
  'poco-nuvoloso-notte': 'M8.500 3a4 4 0 0 0 5 6.200A5 5 0 0 1 8.500 3ZM8 21h9a3.500 3.500 0 0 0 .4-6.980A5 5 0 0 0 8 15.200 3 3 0 0 0 8 21Z',
  'nuvoloso': 'M7.500 19a4.500 4.500 0 0 1-.4-8.980A6 6 0 0 1 18.500 11a4 4 0 0 1-.5 8Z',
  'coperto': 'M7 20a4 4 0 0 1-.3-7.980A5.500 5.500 0 0 1 17.500 13a3.500 3.500 0 0 1-.5 7ZM9 9.500A4.500 4.500 0 0 1 17 7.500 4 4 0 0 1 21 11.500',
  'nebbia': 'M7.500 13a4.500 4.500 0 0 1-.4-8.980A6 6 0 0 1 18.500 5a4 4 0 0 1-.5 8ZM4 17h16M7 21h10',
  'pioggerella': 'M7.500 14a4.500 4.500 0 0 1-.4-8.980A6 6 0 0 1 18.500 6a4 4 0 0 1-.5 8ZM8 18h.01M12 18h.01M16 18h.01M10 21h.01M14 21h.01',
  'pioggia': 'M7.500 14a4.500 4.500 0 0 1-.4-8.980A6 6 0 0 1 18.500 6a4 4 0 0 1-.5 8ZM8 17.500l-1 3M12.500 17.500l-1 3M17 17.500l-1 3',
  'pioggia-forte': 'M7.500 12.500a4.500 4.500 0 0 1-.4-8.980A6 6 0 0 1 18.500 4.500a4 4 0 0 1-.5 8ZM6.500 16l-1 3M10 16l-1 5M13.500 16l-1 3M17 16l-1 5',
  'rovescio': 'M12 2.500V4M4.600 5.100l1.100 1.100M2.500 11H4M19.400 5.100l-1.100 1.100M21.500 11H20M16.500 11a4.500 4.500 0 0 0-8.300-2.400M8 17h9a3.500 3.500 0 0 0 .4-6.980A5 5 0 0 0 8 11.200 3 3 0 0 0 8 17ZM9 20l-.8 2M13 20l-.8 2M17 20l-.8 2',
  'temporale': 'M7.500 14a4.500 4.500 0 0 1-.4-8.980A6 6 0 0 1 18.500 6a4 4 0 0 1-.5 8ZM13 13l-3 4h4l-3 5',
  'temporale-grandine': 'M7.500 12.500a4.500 4.500 0 0 1-.4-8.980A6 6 0 0 1 18.500 4.500a4 4 0 0 1-.5 8ZM13 12.500l-2.500 3.500h3.500L11.500 20M7 17h.01M7.500 21h.01M17 17h.01M16.500 21h.01',
  'neve': 'M7.500 14a4.500 4.500 0 0 1-.4-8.980A6 6 0 0 1 18.500 6a4 4 0 0 1-.5 8ZM8 18h.01M12 20h.01M16 18h.01M12 17h.01M8 21.500h.01M16 21.500h.01',
  'vento': 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7a2.500 2.500 0 1 1-2.500 2.500',
  'termometro': 'M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0ZM12 10v6',
  'percepita': 'M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0ZM17 6h4M17 10h3',
  'umidita': 'M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11Z',
  'pioggia-prob': 'M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11ZM9.500 14.500a2.500 2.500 0 0 0 2.500 2.500',
  'pressione': 'M4 18a9 9 0 1 1 16 0M12 14l4-5M7 18h.01M17 18h.01',
  'uv': 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 3v2M12 19v2M5 5l1.400 1.400M17.600 17.600 19 19M3 12h2M19 12h2M5 19l1.400-1.400M17.600 6.400 19 5',
  'copertura': 'M7.500 19a4.500 4.500 0 0 1-.4-8.980A6 6 0 0 1 18.500 11a4 4 0 0 1-.5 8ZM9 12.500h.01',
  'bussola': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15 9l-1.800 4.200L9 15l1.800-4.200L15 9Z',
  'freccia-vento': 'M12 20V5M6 11l6-6 6 6',
  'raffica': 'M3 8h9a3 3 0 1 0-3-3M3 13h14a3 3 0 1 1-3 3M19 4l-2 3h3l-2 3',
  'onda': 'M2 8c2.500 0 2.500 2 5 2s2.500-2 5-2 2.500 2 5 2 2.500-2 5-2M2 15c2.500 0 2.500 2 5 2s2.500-2 5-2 2.500 2 5 2 2.500-2 5-2',
  'onda-lunga': 'M2 12c3.500-7 7-7 10 0s6.500 7 10 0',
  'marea-alta': 'M2 15c2.500 0 2.500 2 5 2s2.500-2 5-2 2.500 2 5 2 2.500-2 5-2M12 12V4M8.500 7.500 12 4l3.500 3.500',
  'marea-bassa': 'M2 15c2.500 0 2.500 2 5 2s2.500-2 5-2 2.500 2 5 2 2.500-2 5-2M12 4v8M8.500 8.500 12 12l3.500-3.500',
  'corrente': 'M3 9h14M13 5l4 4-4 4M21 17H7M11 13l-4 4 4 4',
  'temp-mare': 'M8 10V5a2 2 0 1 1 4 0v5a3.500 3.500 0 1 1-4 0ZM2 20c2 0 2 1.500 4 1.500S8 20 10 20s2 1.500 4 1.500S16 20 18 20s2 1.500 4 1.500',
  'alba': 'M12 3v5M8 7l4-4 4 4M3 19h18M6.500 15a5.500 5.500 0 0 1 11 0',
  'tramonto': 'M12 8V3M8 4l4 4 4-4M3 19h18M6.500 15a5.500 5.500 0 0 1 11 0',
  'luna': 'M20 14.500A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500Z',
  'attivita-pesci': 'M2.500 13c0-3.200 3.200-5.500 7.200-5.500s6.300 2.300 6.300 5.500-2.600 5.500-6.300 5.500-7.200-2.300-7.200-5.500ZM16 13l3.400-3.300a.7.7 0 0 1 1.200.5v5.600a.7.7 0 0 1-1.200.5L16 13ZM6.500 12h.01M10 3.500v1.500M13.500 4.800 12.600 6M6.500 4.800 7.400 6',
  'luogo': 'M12 21s-7-6.200-7-11a7 7 0 0 1 14 0c0 4.800-7 11-7 11ZM14.500 10a2.500 2.500 0 1 1-5 0 2.500 2.500 0 0 1 5 0Z',
  'posizione': 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3',
  'aggiorna': 'M4 12a8 8 0 0 1 14-5.300L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.300L4 15M4 20v-5h5',
}

export const weatherLabels = {
  'sereno': 'Sereno (giorno)',
  'sereno-notte': 'Sereno (notte)',
  'poco-nuvoloso': 'Poco nuvoloso (giorno)',
  'poco-nuvoloso-notte': 'Poco nuvoloso (notte)',
  'nuvoloso': 'Nuvoloso',
  'coperto': 'Coperto',
  'nebbia': 'Nebbia',
  'pioggerella': 'Pioggerella',
  'pioggia': 'Pioggia',
  'pioggia-forte': 'Pioggia forte',
  'rovescio': 'Rovescio',
  'temporale': 'Temporale',
  'temporale-grandine': 'Temporale con grandine',
  'neve': 'Neve',
  'vento': 'Vento',
  'termometro': 'Temperatura',
  'percepita': 'Temperatura percepita',
  'umidita': 'Umidità',
  'pioggia-prob': 'Probabilità di pioggia',
  'pressione': 'Pressione',
  'uv': 'Indice UV',
  'copertura': 'Copertura nuvolosa',
  'bussola': 'Direzione',
  'freccia-vento': 'Freccia vento (ruotare)',
  'raffica': 'Raffica',
  'onda': 'Onda',
  'onda-lunga': 'Onda lunga (swell)',
  'marea-alta': 'Alta marea',
  'marea-bassa': 'Bassa marea',
  'corrente': 'Corrente',
  'temp-mare': 'Temperatura del mare',
  'alba': 'Alba',
  'tramonto': 'Tramonto',
  'luna': 'Luna',
  'attivita-pesci': 'Attività dei pesci',
  'luogo': 'Luogo',
  'posizione': 'La mia posizione',
  'aggiorna': 'Aggiorna',
}

// Codici WMO (Open-Meteo e simili) → nome icona. `isDay` sceglie la variante notte dove esiste.
export function wmoToIcon(code, isDay = true) {
  if (code === 0 || code === 1) return isDay ? 'sereno' : 'sereno-notte'
  if (code === 2) return isDay ? 'poco-nuvoloso' : 'poco-nuvoloso-notte'
  if (code === 3) return 'coperto'
  if (code === 45 || code === 48) return 'nebbia'
  if ([51, 53, 55, 56, 57].includes(code)) return 'pioggerella'
  if ([61, 63, 66].includes(code)) return 'pioggia'
  if ([65, 67].includes(code)) return 'pioggia-forte'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'neve'
  if ([80, 81, 82].includes(code)) return 'rovescio'
  if (code === 95) return 'temporale'
  if (code === 96 || code === 99) return 'temporale-grandine'
  return 'nuvoloso'                       // codice sconosciuto o mancante: mai un'icona sbagliata e vistosa
}

// Testo italiano della condizione: l'icona non basta mai da sola (accessibilità).
export function wmoLabel(code) {
  if (code === 0) return 'Sereno'
  if (code === 1) return 'Prevalentemente sereno'
  if (code === 2) return 'Poco nuvoloso'
  if (code === 3) return 'Coperto'
  if (code === 45 || code === 48) return 'Nebbia'
  if ([51, 53, 55].includes(code)) return 'Pioggerella'
  if ([56, 57].includes(code)) return 'Pioggerella gelata'
  if (code === 61) return 'Pioggia debole'
  if (code === 63) return 'Pioggia'
  if (code === 65) return 'Pioggia forte'
  if ([66, 67].includes(code)) return 'Pioggia gelata'
  if ([71, 73, 75].includes(code)) return 'Neve'
  if (code === 77) return 'Granelli di neve'
  if ([80, 81].includes(code)) return 'Rovesci'
  if (code === 82) return 'Rovesci forti'
  if ([85, 86].includes(code)) return 'Rovesci di neve'
  if (code === 95) return 'Temporale'
  if (code === 96 || code === 99) return 'Temporale con grandine'
  return 'Non disponibile'
}

export const isNight = (date, sunrise, sunset) => date < sunrise || date >= sunset
