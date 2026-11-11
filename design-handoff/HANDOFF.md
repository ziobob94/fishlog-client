# FishLog — passaggio del nuovo design a Claude Code

Leggi questo file per primo. Descrive il restyling dell'interfaccia di `fishlog-client` (Vue 3 + Tailwind + Pinia + vue-i18n) disegnato su un canvas di 33 schermate. Qui trovi tutto il necessario per implementarlo.

## Contenuto della cartella

| Cartella | Cosa c'è |
|---|---|
| `screenshots/` | Un PNG per ogni schermata, numerati nell'ordine del canvas. **Sono il riferimento visivo.** Gli screenshot usano i font reali (Fraunces, Manrope; i numeri in JetBrains Mono possono apparire di ripiego). |
| `design/` | Sorgenti del design (`*.dc.html`, `canvas.json`) e `support.js`. Per vederli interattivi: `cd design && python3 -m http.server 8080`, poi apri `http://localhost:8080/Main.dc.html`. Servono per leggere misure, colori e testi esatti. Non vanno copiati nel progetto. |
| `tokens/` | `tokens.css` (variabili CSS) e `tailwind-extend.js` (estensione del tema). |
| `assets/` | Logo (`logo-mark.svg`, `logo-mark-light.svg`, `favicon.svg`), icone app PNG 192/512, `icons-list.json`. |
| `vue-starter/` | Componenti Vue pronti da copiare in `src/components/`: `FishLogo`, `AppIcon` + `icons.js`, `IsobathBg`, `TideDivider`, `RulerFrame`, `StampBadge`, `Bobber`. |

## Regole importanti

1. **Il design è una proposta di interfaccia, non una specifica del backend.** Molte schermate usano dati di esempio. Prima di usare un dato, controlla che l'API lo fornisca (sezione «Backend»). Non inventare endpoint senza dirlo.
2. **Italiano** per tutti i testi, tramite `vue-i18n` (`src/i18n/locales/it.json`). I testi del design sono la base per le chiavi nuove.
3. **Tema chiaro:** il design è solo scuro. Il tema chiaro resta com'è; i token nuovi hanno già i valori chiari in `tokens.css`. Verifica che le schermate nuove siano leggibili anche lì.
4. **Procedi per fasi** (vedi «Piano»), con un commit per fase e `npm run build` che passa. Non riscrivere tutto in un colpo.
5. **Dati legali delle specie** (taglia minima, fermo pesca): nel design sono segnaposto `[dato dalla normativa]`. Restano quelli con fonte citata che arrivano già dal server.

## Linguaggio visivo («carta nautica»)

### Font (regola attuale, dalle schermate 42-47)
- **Fraunces** (serif, 700-800, `letter-spacing: -.01em`): **solo titoli di pagina e titoli di card** (es. «La mia bacheca», «Nuovo post», «Prima spigola dell'autunno»). Classe `font-display` in Tailwind.
- **Manrope**: etichette, valori, testi corrente, bottoni, chip, navigazione e la parola «FishLog» del logo.
- **JetBrains Mono**: **solo** numeri, coordinate e misure (conteggi, date/ore, «52 cm», percentuali). Classe `font-mono`.
- Mai Fraunces su bottoni, chip, navigazione, etichette e testo corrente; mai Mono su parole.
- Carica da Google Fonts: `Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800`. Token in `tokens/tokens.css`.
- Nota: le schermate 01-41 seguono ancora la regola precedente (Fraunces anche su titoli di riga da 15-19 px e valori in evidenza, es. «Poco mosso»). Per allinearle: valori e titoli di riga in Manrope 800, Fraunces solo sul titolo della card.

Identità invariata (oceano + sabbia), più gerarchia e una firma riconoscibile.

- **Colori scuri più profondi:** sfondo `#111c2c`, card `#1a293d`, riquadri `#243650`, bordi `#33486a`. Valori e triplette RGB in `tokens/tokens.css`.
- **Testo su fondo scuro:** usa le varianti `ocean-text` (#7dd3fc) e `sand-text` (#fbbf24); le tinte piene `ocean`/`sand` restano per riempimenti. Contrasto ≥ 4,5:1.
- **Pulsante primario:** testo scuro `#0b1623` su `ocean` (contrasto ~6:1). Oggi il repo usa `text-white` (~2,8:1): va cambiato in `.btn-primary`.
- **Bersagli tocco ≥ 44 px** per ogni elemento interattivo (chip, icone, nav).
- **Raggi:** pulsanti e input 12–16 px, card 20 px, riquadri hero 24 px, chip 22 px (pillola). Firma: le card principali e le foto hanno `24px 24px 24px 8px` (angolo in basso a sinistra meno arrotondato; classe `rounded-signature`).
- **Dati chiave** in JetBrains Mono, grandi (30–44 px); etichette in maiuscolo con tracking 0,14em, 12 px.
- **Icone:** griglia 24, tratto 2 px, estremità e angoli arrotondati, nessuna punta. 39 icone in `vue-starter/icons.js` (vedi la schermata `33-Icone.png`). Si possono usare con `<AppIcon name="uscite" />` al posto di `lucide-vue-next`, oppure continuare con Lucide per le icone non presenti: lo stile è compatibile.
- **Logo:** pesce contento (occhio grande con riflesso, sorriso) in un riquadro `ocean`. Versioni scura e chiara in `FishLogo.vue`; regole d'uso in `31-Logo.png`. Sostituisci favicon e icone PWA in `public/`.

### Sei elementi distintivi (`32-Stile.png`)

| Elemento | Componente | Dove va |
|---|---|---|
| Isobate (curve di livello) | `IsobathBg.vue` | Intestazione Home, Accesso, riquadro mappa del dettaglio uscita |
| Linea di marea (onda al posto della riga) | `TideDivider.vue` | Sostituisce `.section-divider` e le righe tra sezioni; variante `sand` per l'uscita in corso |
| Cornice a metro | `RulerFrame.vue` | Foto/video delle catture (feed, dettaglio uscita, miniature nelle liste) con la pillola misura |
| Coordinate e timbro | `StampBadge.vue` + testo mono `43.72°N · 13.22°E` | Card delle uscite, intestazione dettaglio; timbro per record e traguardi |
| Galleggiante | `Bobber.vue` | Stati vuoti, caricamenti, tira-per-aggiornare |
| Voce | testi in `it.json` | «Abboccata! Spigola, 52 cm.», «Mare calmo», «Si è spezzato il filo. Riprova.» Nelle norme e nei dati legali il tono resta neutro. |

## Mappa schermate → codice

Ordine e numeri come in `screenshots/`. Stato: **Restyling** = esiste già, cambia la grafica; **Nuovo** = manca nel codice.

| # | Schermata | Route / file | Stato |
|---|---|---|---|
| 01 | Home mobile | `/` → `HomeView.vue` | Restyling + nuovo mappamondo |
| 04 | Home desktop | `/` → `HomeView.vue`, `AppSidebar.vue` | Restyling + mappamondo |
| 02 | Uscite | `/sessions` → `SessionsView.vue`, `SessionCard.vue`, `SessionFilters.vue` | Restyling |
| 03 | Dettaglio uscita | `/session/:id` → `SessionView.vue` | Restyling |
| 12 | Nuova uscita (solo essenziale) | `/new` → `NewSessionView.vue`, `SessionForm.vue` | **Semplificata**: luogo, quando, tecnica; il resto in «Dati uscita» |
| 05 | Social · feed | `/feed` → `FeedView.vue`, `PostCard.vue` | Restyling |
| 06 | Nuovo post | `PostForm.vue` | Restyling |
| 17 | Commenti | commenti del post (`stores/posts.js`) | Restyling (verificare) |
| 18 | Profilo utente | `/users/:id` → `UserProfileView.vue` | Restyling |
| 19 | Amici | `/friends` → `FriendsView.vue` | Restyling |
| 20 | Gruppi | `/groups` → `GroupsView.vue` | Restyling |
| 21 | Notifiche | `stores/notifications.js`, `AppTopbar.vue` | Restyling (verificare) |
| 07 | Chat · lista | `/chat` → `ChatView.vue` | Restyling |
| 08 | Chat · conversazione | `/chat/:userId` → `ChatThread.vue` | Restyling |
| 25 | Nuovo gruppo chat | `/chat/group/new` → `NewGroupView.vue` | Restyling |
| 09 | Market · annunci | `/market` → `MarketView.vue`, `ListingCard.vue`, `ListingFilters.vue` | Restyling |
| 10 | Market · annuncio | `/market/:id` → `ListingView.vue` | Restyling |
| 23 | Market · negozi | `MarketView.vue` (tab Negozi), `ShopView.vue`, `ShopCard.vue` | Restyling |
| 24 | Market · nuovo annuncio | `/market/new` → `NewListingView.vue`, `ListingForm.vue` | Restyling |
| 11 | Accesso | `/login` → `LoginView.vue` | Restyling |
| 27 | Registrazione | `/register` → `RegisterView.vue` | Restyling |
| 13 | Statistiche | `/stats` → `StatsView.vue` | Restyling (+ grafico per mese, vedi Backend) |
| 14 | Classifica | `/classifica` → `LeaderboardView.vue` | Restyling |
| 15 | Specie · ricerca | `/species` → `SpeciesSearchView.vue` | Restyling |
| 16 | Specie · scheda | `/species/:name` → `SpeciesView.vue` | Restyling |
| 22 | Profilo e impostazioni | `/profile` → `ProfileView.vue` | Restyling (scelta tema) |
| 26 | Mappamondo (componente) | nuovo `GlobeCard.vue` | **Nuovo** |
| 28 | Venditore · 1 richiesta | nuova view | **Nuovo** |
| 29 | Venditore · 2 stato verifica | nuova view | **Nuovo** |
| 30 | Venditore · 3 configura negozio | nuova view | **Nuovo** |
| 31–33 | Logo, Stile, Icone | riferimento, nessuna view | — |

Non disegnati: Admin e pagine legali (privacy, termini, cookie).

### Flusso uscita semplificato (schermate 34-38, riga y=8800 del canvas)
Il form unico a sezioni e la scheda «Modifica uscita» erano confusionari. Nuovo flusso a passi corti:

| # | Schermata | Codice di oggi | Cosa cambia |
|---|---|---|---|
| 12 | Nuova uscita | `NewSessionView.vue` / `SessionForm.vue` | Solo luogo, data/ora, ambiente, tecnica. Interruttore «Uscita già conclusa». CTA «Inizia a pescare» (crea `ongoing` e va a `/session/:id/edit`) |
| 34 | Uscita in corso | `EditSessionView.vue` + `OngoingCatchForm.vue` | Un grande «Aggiungi cattura», **un solo** stato vuoto, elenco catture salvate, «Chiudi uscita». Barra di navigazione nascosta. Il bottone «Modifica altri dati» diventa l'icona «⋯» → Dati uscita |
| 35 | Aggiungi cattura | `CatchesSection.vue`, `SpeciesQuickAdd.vue` | Pagina a sé: ricerca + chip delle specie frequenti (con «1 qui»), peso e lunghezza grandi, «Rilasciato», foto, «Altri dettagli». Salvataggio **esplicito** («Salva cattura» / «Salva e aggiungine un'altra»), non più autosave |
| 36 | Chiudi uscita | `OngoingCatchForm.vue` (dialog di chiusura) | Riepilogo, voto a stelle, note, visibilità, «Chiudi uscita» / «Continua a pescare» |
| 37 | Dati uscita | `SessionForm.vue` (sezioni) | Elenco di righe con stato (Compilato / Da aggiungere) che porta a una schermata per sezione; «Elimina uscita» in fondo |
| 38 | Acqua e meteo | sezioni acqua/meteo di `SessionForm.vue` | Chip e campi grandi, precompila dal GPS. (Il selettore Acqua/Meteo nel mockup non cambia ancora il contenuto: nel codice sono due gruppi separati) |

Chiavi i18n da aggiungere/rinominare: `session.ongoing.*`, `catchesSection.*`, `sessionForm.*`. Il tasto «Riprendi» in Home e Uscite porta a `/session/:id/edit` (schermata 34).

### Creare post e storie (schermate 39-41, riga y=10200 del canvas)
Prima mancava il punto d'ingresso per un nuovo post. Ora:

| # | Schermata | Codice | Note |
|---|---|---|---|
| 39 | Crea (foglio dal basso) | nuovo, apre da «+» della barra (tranne nei Social, dove il «+» crea subito un post) | Post, Storia, Uscita, Annuncio. Il «+» non porta più direttamente a `PostForm.vue` |
| 05 | Social · feed | `FeedView.vue` | Il filtro (Per te / Amici / Gruppi / Eventi) non è più una fila di chip: è il titolo della pagina con freccia («Per te ▾») che apre un menu. In alto: fila storie (`StoriesRail.vue`, nuovo) e riga «Cosa hai pescato oggi?» che apre il form del post |
| 40 | Storia · crea | nuovo `StoryComposer.vue` | Foto/video, adesivi della pesca (cattura, luogo, acqua e meteo), pubblico Tutti / Solo amici, scade dopo 24 ore |
| 41 | Storia · guarda | nuovo `StoryViewer.vue` | Barre di avanzamento, risposta in chat, cuore. L'adesivo cattura apre il dettaglio uscita |

**Backend da aggiungere** (`fishlog-server`): modello `Story` (autore, media, adesivi, pubblico, `expiresAt` = +24 h con indice TTL), elenco storie degli amici raggruppate per autore con flag «vista», registrazione delle visualizzazioni, risposta alla storia come messaggio chat. Upload media come per le catture.

### Profilo e bacheca personale (schermate 42-47, riga y=11300 del canvas)
**Decisione:** il profilo è la bacheca personale, in stile Instagram (`/board`, `MyBoardView.vue` riscritta). Toccando il proprio avatar o nome nei Social si apre lì. Le **impostazioni non stanno più nel profilo**: si raggiungono dal menù (icona in alto a destra). La creazione usa **le stesse pagine dedicate di Social** (nuovo post/evento, nuova storia, schermate 39-41), non una variante: il form inline di `MyBoardView.vue` sparisce. Cambia solo l'ingresso (il «+» della barra apre il foglio Crea; l'anello con «+» sull'avatar apre direttamente la storia) e il ritorno (chiudere o pubblicare riporta a `/board`). Nel foglio Crea c'è anche **Evento**, perché `PostForm.vue` ha il tipo post/evento.

| # | Schermata | Codice | Stati / note |
|---|---|---|---|
| 42 | La mia bacheca (profilo) | `MyBoardView.vue` (`/board`), nuovo `ProfileHeader.vue`, `PostGrid.vue` | Header: avatar con anello storia (sabbia/oceano; tratteggiato con «+» se non c'è), nome utente come titolo, menù in alto a destra; statistiche uscite / catture / amici (mono), nome, bio, luogo con coordinate (mono), «Modifica profilo». Tab **Post · Uscite · Salvati**; griglia 3 colonne quadrata (video con durata, più foto con icona). Stati: con post · vuota (invito «Crea il primo post») · caricamento (skeleton, `role=status`) · errore (`role=alert`, «Riprova»). Toccando un tassello si apre il dettaglio del post (`PostCard.vue` in pagina, non disegnato) |
| 43 | Menù Crea da bacheca | foglio Crea (come 39) | Post e Evento → 44, Storia → 45, Uscita, Annuncio. Voce «Evento» aggiunta anche al foglio 39 |
| 44 | Nuovo post / evento | `PostForm.vue` come pagina (`/post/new`) | Vuoto · Compilato · Invio (avanzamento foto) · Errore di rete · Da correggere (`bodyRequired`, nome evento). Visibilità Pubblico/Gruppo/Solo io (`groupRequired`) |
| 45 | Nuova storia | `StoryComposer.vue` (come 40) | Fotocamera · Senza permesso · Modifica (adesivo cattura, Tutti/Solo amici) · Invio (%) · Errore (Riprova / Elimina) |
| 46 | Menù del profilo | nuovo `ProfileMenu.vue` (foglio dal basso) | Impostazioni profilo, Privacy, Notifiche, Esci (in rosso → logout e `/login`). Privacy e Notifiche portano alla pagina 47 nel disegno; nel codice possono essere sezioni o route separate (`/settings/privacy`, `/settings/notifications`) |
| 47 | Impostazioni profilo | nuovo `ProfileSettingsView.vue` | Foto, nome, nome utente, bio (max 150, contatore mono), luogo. Stati: modifica · nome utente già in uso (errore sul campo, `aria-invalid`) · salvataggio. Va tolto da qui qualsiasi accesso alle impostazioni dal profilo |

Nessun nuovo endpoint per il post (`store.createPost` resta). Da verificare nel server: conteggi uscite/catture/amici sul profilo, elenco «Salvati» (se manca, serve un modello di segnalibri), unicità del nome utente. Le schermate sono solo disegnate, non funzionanti.

### Rinomina: «Social» → «Social»
Nella barra, nei titoli e nei testi la sezione si chiama **Social**. Cambia solo l'etichetta (chiave i18n, es. `nav.social` → testo «Social»); route (`/feed`), file e nomi dei componenti restano invariati. Le schermate 05, 06, 17, 18 sono ancora intitolate «Social» nei nomi dei file.

## Navigazione (cambia)

- **Mobile, barra in basso:** Home · Uscite · **+** (tasto centrale grande, azione «Nuova uscita») · Social · Market. Oggi è Home, Uscite, Feed, Market, Chat.
- **Il «+» centrale** apre il foglio «Crea» (post, storia, uscita, annuncio); **solo nei Social** porta direttamente al nuovo post (la storia si crea da «La tua storia»). **Chat esce dalla barra:** si apre dall'icona messaggi (con badge) nell'intestazione di Social, come i DM di Instagram. Mantieni il badge dei non letti.
- **Desktop:** la sidebar resta, con le stesse voci raggruppate (Pesca, Social) e l'icona/logo nuovi.
- La barra è a 5 colonne; il «+» sporge di 30 px, 56×56, con bordo dello stesso colore dello sfondo.

## Funzioni nuove

### Mappamondo 3D nella Home (schermata 26)

Posizione dell'utente (punto azzurro con pulsazione, etichetta «Tu sei qui») e un segnaposto sabbia per ogni uscita già fatta, raggruppati con un numero se vicini. Si trascina per ruotare; pulsanti: zoom +/−, «Vai alla mia posizione», «Mostra le mie pescate». Toccando un segnaposto compare una scheda con luogo, data e catture che porta al dettaglio uscita.

- Il prototipo usa una proiezione ortografica scritta a mano con coste approssimate: **non portarla in produzione.** Usa una libreria (es. `globe.gl` / three.js, oppure `d3-geo` con `world-atlas` in SVG).
- Dati: coordinate delle uscite (`lat`/`lng`, già raccolte da `LocationPicker.vue`) e posizione del dispositivo con `navigator.geolocation` (chiedere il permesso solo al tocco di «Vai alla mia posizione» o «La mia posizione», con messaggio chiaro se negato).
- Accessibilità: il globo ha `role="img"` e descrizione; offrire anche l'elenco delle uscite come alternativa testuale. Con `prefers-reduced-motion` niente rotazione automatica né pulsazione.
- Il drag sul telefono non deve bloccare lo scorrimento della pagina: valutare la rotazione solo con un dito dentro il globo e scorrimento fuori.

### Percorso venditore (schermate 28–30)

I venditori devono essere **autorizzati e verificati prima di pubblicare annunci.**

1. **Richiesta:** scelta Privato / Negozio, dati (ragione sociale, P.IVA, città, telefono), documento (visura) caricato, conferma dati.
2. **Stato verifica:** in revisione (non si può pubblicare), approvato, rifiutato (con motivo e «Modifica e reinvia»). Nel design un selettore in alto permette di vedere i tre stati: **è solo per l'anteprima, non va nell'app.**
3. **Configura il negozio** (solo dopo l'approvazione, badge «Verificato»): logo, nome, descrizione, sito web (se c'è), città, consegna (ritiro/spedizione), contatto. Ragione sociale e P.IVA verificate sono in sola lettura. In fondo la card «Vuoi un sito per il tuo negozio?» con «Sì, contattatemi» / «No, grazie»: è un servizio proposto da noi.

Fuori da questo task (gestione a parte): il pannello admin per approvare le richieste e il flusso di realizzazione del sito.

## Backend (da verificare in `fishlog-server`)

Cose che il design assume e che potrebbero non esserci. **Controlla prima nel codice; non dare per scontato.**

- Mi piace sui post (il client ha già `addComment`/`deleteComment`; i like non risultano).
- Uscita collegata a un post (scheda «Uscita collegata» sotto la foto).
- Statistiche: catture **per mese** negli ultimi 12 mesi.
- Notifiche per mi piace e commenti.
- Misura della cattura in cm e foto dell'uscita (per la cornice a metro).
- Richiesta venditore: stato (`in_revisione` / `approvato` / `rifiutato`), motivo del rifiuto, documento caricato, dati attività, tipo (privato/negozio). Annunci pubblicabili solo se `approvato`. Endpoint per l'admin.
- Richiesta di contatto per il sito del negozio (anche solo salvata o inviata per email).

Se una voce manca, nel client implementa la parte grafica con stato vuoto/«in arrivo» e segnala cosa serve sul server, senza simulare dati finti in produzione.

## Piano

1. **Fondamenta:** `tokens.css` in `main.css`, `tailwind-extend.js` in `tailwind.config.js`, `.btn-primary` con testo scuro, `.card` e raggi nuovi, favicon/icone PWA, `FishLogo` in Topbar/Sidebar/Login. Controlla tutte le schermate: i colori cambiano ovunque.
2. **Guscio:** nuova barra in basso, Chat dentro Social, sidebar con logo nuovo.
3. **Componenti distintivi:** copia i sei componenti da `vue-starter/`, `AppIcon`, sostituisci `.section-divider` con `TideDivider`.
4. **Schermate esistenti**, in quest'ordine: Accesso/Registrazione → Home → Uscite/Dettaglio/Nuova uscita → Social/Post/Commenti → Chat → Market → Specie → Statistiche/Classifica → Profilo/Amici/Gruppi/Notifiche.
5. **Mappamondo** nella Home.
6. **Percorso venditore** (con le parti server).
7. **Rifinitura:** tema chiaro, `prefers-reduced-motion`, tastiera e focus visibile, ≥ 44 px, contrasti, schermi 320 px e desktop 1360 px.

## Verifiche finali

- `npm run build` senza errori; nessun testo in italiano lasciato fuori da `it.json`.
- Confronta ogni schermata con il suo PNG in `screenshots/` a 390 px (mobile) e 1360 px (desktop).
- Contrasto ≥ 4,5:1 sul testo; ogni elemento cliccabile è un vero `button`/`a`; campi con `label`.
