# FishLog — passaggio del nuovo design a Claude Code

Leggi questo file per primo. Descrive il restyling dell'interfaccia di `fishlog-client` (Vue 3 + Tailwind + Pinia + vue-i18n) disegnato su un canvas di 33 schermate. Qui trovi tutto il necessario per implementarlo.

## Contenuto della cartella

| Cartella | Cosa c'è |
|---|---|
| `screenshots/` | Un PNG per ogni schermata, numerati nell'ordine del canvas. **Sono il riferimento visivo.** Gli screenshot usano i font reali (Fraunces, Manrope; i numeri in JetBrains Mono possono apparire di ripiego). |
| `design/` | Sorgenti del design (`*.dc.html`, `canvas.json`) e `support.js`. Per vederli interattivi: `cd design && python3 -m http.server 8080`, poi apri `http://localhost:8080/Main.dc.html`. Servono per leggere misure, colori e testi esatti. Non vanno copiati nel progetto. |
| `tokens/` | `tokens.css` (variabili CSS) e `tailwind-extend.js` (estensione del tema). |
| `assets/` | Logo (`logo-mark.svg`, `logo-mark-light.svg`, `favicon.svg`), icone app PNG 192/512, `icons-list.json`. |
| `vue-starter/` | Componenti Vue pronti da copiare in `src/components/`: `FishLogo`, `AppIcon` + `icons.js`, `IsobathBg`, `TideDivider`, `RulerFrame`, `StampBadge`, `Bobber`; in `vue-starter/motion/` gli esempi del sistema di movimento. |

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

### Rinomina: «Community» → «Social»
Nella barra, nei titoli e nei testi la sezione si chiama **Social**. Cambia solo l'etichetta (chiave i18n, es. `nav.community` → testo «Social»); route (`/feed`), file e nomi dei componenti restano invariati. Le schermate 05, 06, 17, 18 sono ancora intitolate «Community» nei nomi dei file.

### Tocco sull'avatar: storia o profilo (schermate 05 e 41)
Regola unica per ogni avatar (componente `UserAvatar.vue`, con `hasStory`):
- **Se l'utente ha una storia attiva** (anello sabbia/oceano) il tocco la apre (`StoryViewer.vue`, schermata 41); **se non ce l'ha** apre il suo profilo (`/u/:id`, o `/board` se è il mio).
- **Il mio avatar nel Social** (fila storie e riga «Cosa hai pescato oggi?»): ho una storia → la guardo; non ce l'ho → vado a «La mia bacheca». Il «+» sul bordo è un pulsante a parte (44 px) e aggiunge sempre una storia.
- **Avatar degli autori nei post**: con anello apre la storia, senza anello il profilo. Il nome dell'autore porta sempre al profilo.
- **Dentro la storia** (41): toccare avatar o nome in alto porta al profilo dell'autore (`ProfiloUtente`; al proprio `/board`). Chiudere resta la X.
- In Community (05) il selettore «Anteprima» alterna «Ho una storia / Nessuna storia» per vedere i due casi.
Servono `hasStory` e `storyUnseen` per utente nelle risposte del feed.

## Modulo Gare (schermate 48-55, riga y=12700 del canvas) — DA APPROVARE PRIMA DI IMPLEMENTARE
Ogni schermata ha un foglio scuro (`NN-Nome.png`) e uno chiaro (`NN-Nome-chiaro.png`) con tutti gli stati affiancati, numerati. Nel canvas le coppie scuro/chiaro sono affiancate e ogni mockup ha il selettore «Anteprima».

**Scelte già prese:** il giudice inserisce i risultati e i partecipanti li vedono soltanto; classifiche pubbliche con link senza account; gare singole e a squadre; gare con rilascio (solo lunghezza, peso stimato dalla tabella) e con pesatura (peso misurato); tabella lunghezza-peso per specie importata da CSV e modificabile.

**Regole di default (tutte configurabili per campionato):** classifica di gara a peso totale, punti = piazzamento; generale = somma dei piazzamenti (meno è meglio) con 1 scarto dalla 4ª prova (si scarta il risultato peggiore, a parità l'ultimo); cappotto = piazzamento pari a partecipanti + 1; pari merito = media dei posti; spareggio per numero di catture e poi pesce più grande (se restano pari: media dei posti); taglia minima configurabile per specie (sotto taglia: si registra ma non conta).

| # | Schermata | Vue (proposta) | Stati disegnati |
|---|---|---|---|
| 48 | Elenco campionati e creazione | `ChampionshipsView.vue` | Miei · Partecipo · Pubblici · Vuoto · Caricamento (Bobber) · Offline · Nuovo campionato (nome, formato singolo/squadre/entrambi, modalità predefinita, classifica pubblica) |
| 49 | Dettaglio campionato (tab Classifica · Gare · Iscritti · Regole) | `ChampionshipView.vue`, `StandingsTable.vue` | Classifica generale con scarto evidenziato, cappotto (C) e pari merito · Gare · Iscritti · Regole · Senza gare · Caricamento · Offline |
| 50 | Dettaglio gara | `RaceView.vue` | In corso (rilascio, provvisoria) · Chiusa · Cappotto (`StampBadge` dedicato) · Pari merito · Spiegazione del pari merito · Caricamento · Offline |
| 51 | Inserimento rapido del giudice | `JudgeEntryView.vue` | Rilascio (cm → peso stimato subito) · Pesatura (kg) · Tabella mancante · Sotto taglia · Correzione/annullo · Annullata con «Ripristina» · Offline (coda sul telefono) |
| 52 | Tabella lunghezza-peso | `WeightTableView.vue` | Panoramica con avviso specie senza tabella · Modifica (righe cm→kg, anteprima con curva) · Importa CSV (righe valide/errori) · Senza tabella · Caricamento · Offline |
| 53 | Impostazioni regole | `RulesView.vue` | Default · Modificato (barra «modifiche non salvate») · Sola lettura (non organizzatore) · Errore (scarti > prove) · Caricamento · Offline |
| 54 | Classifica pubblica condivisibile | `PublicStandingsView.vue`, route senza login | Individuale · Squadre · Condividi (link, QR) · Caricamento · Offline (dati salvati) · Link non valido |
| 55 | Iscritti, squadre e ruoli | `MembersView.vue` | Iscritti · Squadre · Cambia ruolo (Partecipante/Giudice/Organizzatore, rimuovi) · Vuoto · Caricamento · Offline |

**Componenti riusati:** `StampBadge` (cappotto: titolo, posto, «posto»), `TideDivider` (sezioni), `Bobber` (caricamento e vuoti), `RulerFrame` (foto delle catture con il metro), `AppIcon`. `Bobber` ha i colori fissi: nel tema chiaro il corpo va con `var(--color-foam)` e un contorno scuro, come nei mockup.

**Nuovi componenti:** `StandingsTable.vue` (colonne P1…Pn e totale), `ScartoCell.vue` (barrato, bordo tratteggiato sabbia, `aria-label` «scarto»), `PositionBadge.vue` (numero sempre visibile, anche il pari merito «5,5»), `LengthStepper.vue` (− / + da 56 px, campo mono grande), `EstimatedWeightCard.vue`, `OfflineBanner.vue`, `UndoSnackbar.vue`, `RolePicker.vue`.

**Font:** Fraunces solo per titoli di pagina e di card; Manrope per testi, etichette e valori; JetBrains Mono (`font-mono`) per **ogni numero**: cm, kg, punti, posizioni, conteggi, date e ore.

**Accessibilità:** contrasto ≥ 4,5:1 verificato su tutti gli abbinamenti dei due temi (scuro min 5,5:1, chiaro min 4,6:1); tocco ≥ 44 px; la posizione è sempre un numero (mai solo colore o medaglia); scarto, cappotto e pari merito hanno anche un'etichetta di testo e una legenda; `role="status"` sui caricamenti, `role="alert"` su errori e avvisi; `aria-selected`/`aria-checked` su tab, segmentati e radio; `prefers-reduced-motion` ferma Bobber, skeleton e spinner.

**Tema chiaro: due correzioni ai token (già in `tokens/tokens.css`).** Il bianco sul pulsante primario con `ocean` chiaro (`#0382c3`) arriva solo a 4,2:1: nel chiaro il riempimento primario usa `ocean-dark` (`#0369a1`, 5,9:1), nuova variabile `--color-ocean-fill`. Il testo sabbia chiaro `#b45309` scende a 4,4:1 sulle superfici secondarie: ora `#92400e` (≥ 6:1).

**Calcolo (da testare con casi di prova):**
- Punti di gara = piazzamento (pari merito: media dei posti occupati). Cappotto = partecipanti + 1.
- Generale = somma dei piazzamenti, meno gli scarti: dalla prova n. 4 si scartano i peggiori (`scarti` per campionato, `dallaProva`).
- Spareggio ordinato e configurabile; solo se tutti i criteri sono pari si usa la media dei posti.
- Peso stimato (rilascio) = interpolazione lineare tra le due righe della tabella della specie; fuori tabella o specie senza tabella → cattura «da completare», non conta in classifica finché manca il peso.
- Squadre: disegnato come peso totale dei componenti, punti = piazzamento di squadra, con lo stesso scarto. Da confermare.

**Backend da verificare in `fishlog-server`:** modelli `Championship` (formato, modalità, regole, slug pubblico), `Race` (data, luogo, tipo rilascio/pesatura, stato), `Entry` (iscritto, ruolo, squadra), `Team`, `CatchRecord` (gara, iscritto, specie, cm, kg misurato o stimato, foto, annullata, inserita da, timestamp), `WeightTable` (specie, righe cm→kg, fonte). Endpoint pubblico di sola lettura per la classifica (senza login, con cache). Ruoli verificati lato server: solo il giudice scrive catture, solo l'organizzatore cambia regole e ruoli. Inserimenti offline: coda locale (IndexedDB) con invio all'arrivo della rete e id idempotente.

**Da decidere:** 1) dove entra «Gare» (la barra ha già 5 voci: proposta, scheda in Home e voce nel menù del profilo); 2) classifica a squadre (vedi sopra); 3) un pesce sotto taglia si registra ma non conta; 4) come si risolvono i conflitti di inserimento offline tra due giudici.

## Movimento (animazioni e transizioni) — vale per tutta l'app

Stile: calmo e acquatico, come un'onda lunga. Mai rimbalzi: la «molla» è appena accennata (sovraelongazione ≈ 3 %). I valori sono token in `tokens/motion.css` (importare da `tokens.css`; alias Tailwind `duration-fast|base|slow`, `ease-enter|exit|standard|spring` in `tailwind-extend.js`). Gli esempi Vue sono in `vue-starter/motion/`.

### Token
| Token | Valore | Uso |
|---|---|---|
| `--motion-press` | 80 ms | pressione di pulsanti e righe |
| `--motion-fast` | 120 ms | cambi di colore, chip, uscite di dialoghi e toast |
| `--motion-base` | 200 ms | tab, segmented, uscite di pagina e foglio, entrata toast/dialogo, stagger |
| `--motion-slow` | 320 ms | entrata di pagina e foglio, espansione dettaglio, cuore, FLIP classifica |
| Cicli | skeleton 1400 · spinner 800 · galleggiante 2600 ms | animazioni continue (non sono transizioni, esenti dal tetto) |
| `--ease-enter` | `cubic-bezier(.2,.8,.2,1)` | tutto ciò che entra (decelera) |
| `--ease-exit` | `cubic-bezier(.4,0,1,1)` | tutto ciò che esce (accelera) |
| `--ease-standard` | `cubic-bezier(.4,0,.2,1)` | spostamenti che restano sullo schermo |
| `--ease-spring` | `cubic-bezier(.34,1.18,.64,1)` | solo cuore, ritorno del foglio, «+» |
| Distanze | 4 · 8 · 16 · 24 px · 100 % (fogli) | `--dist-xs/sm/md/lg/sheet` |
| Scale | press .97 · modale .96 · pop 1.18 · viewer storie .94 | |
| Stagger | 40 ms a riga, massimo 6 righe | `--stagger-step`, `--stagger-max` |

Regole: si animano **solo `transform` e `opacity`** (più colore/fill, che non spostano nulla) → nessun layout shift; l'uscita è sempre più corta dell'entrata; nei flussi frequenti niente sopra i 320 ms (tetto assoluto 400 ms); spazio per errori e toast riservato in anticipo.

### Elemento per elemento
| Elemento | Durata | Easing | Proprietà |
|---|---|---|---|
| Pagina avanti | entra 320, esce 200 | enter / exit | nuova: `translateX(24px→0)` + opacity; vecchia: opacity → 0 (resta in posizione, absolute) |
| Pagina indietro | entra 320, esce 200 | enter / exit | inversa: nuova `translateX(-24px→0)`, vecchia esce verso destra 24 px |
| Tab della barra | 200 | standard | solo opacity, incrociata, nessuno spostamento |
| Dettaglio da card/griglia | 320 | enter | View Transition: la foto si espande (`view-transition-name`); senza API → «pagina avanti» |
| Foglio dal basso (Crea, profilo, filtri, selettori) | entra 320, esce 200 | enter / exit | `translateY(100%→0)`; sfondo opacity 0→.62 in 200; swipe giù: segue il dito, chiude oltre il 25 % di altezza o 0,5 px/ms, altrimenti torna su 200 ms spring |
| Menù contestuale (⋯) | entra 200, esce 120 | enter / exit | opacity + `translateY(-8px→0)` + scale .96→1, origine all'ancora |
| Modale / conferma | entra 200, esce 120 | enter / exit | scale .96→1 + opacity; sfondo come foglio |
| Toast | entra 200, esce 120 | enter / exit | opacity + `translateY(∓16px→0)`; dall'alto = successo/info/avviso, dal basso = con azione («Annulla») sopra la barra |
| Toast: vita | — | — | successo/info 4 s, avviso 6 s, errore 8 s o fisso; in pausa con tocco/hover/focus; max 3; errore `role="alert"` |
| Pulsante premuto | 80 giù, 120 su | standard | scale .97 (+ colore) |
| Cuore / like | 320 | spring | pop 1→1.18→1 + onda che si espande e sfuma; togliere il like: solo colore 120 ms |
| Segnalibro | 200 | spring | scale .9→1 + fill 120 ms |
| Chip selezionato | 120 | standard | background, border, color |
| Segmented control | 200 | standard | indicatore `translateX`, testo colore 120 |
| Input in errore | 280, una volta | standard | `translateX` ±6 px (3 oscillazioni) + bordo rosso 120; messaggio con riga già riservata |
| Skeleton | ciclo 1400 | linear | riflesso `translateX(-100%→100%)`; ridotto: statico |
| Spinner | ciclo 800 | linear | `rotate`; ridotto: pulsazione opacity |
| Pull to refresh | trascinamento 1:1 con resistenza .5; ritorno 200 | standard | `translateY` max 72 px, soglia 64; galleggiante con ciclo 2600 ms finché carica |
| Liste (primo caricamento) | 200 + 40 ms × riga (max 6) | enter | opacity + `translateY(8px→0)`; non si ripete su refresh o scroll infinito |
| Anello storia | non vista→vista 200; caricamento ciclo 1200 | standard / linear | colore anello; `rotate` durante il caricamento |
| Viewer storie | barra: durata della storia | linear | `scaleX(0→1)`; tenere premuto = pausa; swipe giù chiude (scale .94 + opacity), tocco a lati = prec./succ. con sola opacity 120 |
| «+» nella barra | 200 | spring | `rotate(0→45°)` quando Crea è aperto |
| Classifica live (Gare) | 320 | standard | FLIP: `translateY` delle righe che cambiano posto |
| Cambio tema chiaro/scuro | 200 | standard | background-color, color, border-color |

### Accessibilità
- `prefers-reduced-motion: reduce` (e impostazione in app *Profilo → Impostazioni → «Riduci animazioni»: Auto / Sì / No*, attributo `data-motion` su `<html>`) azzera distanze e scale, porta le durate a ≤ 120 ms: pagine, fogli, dialoghi e toast restano **solo dissolvenza**; scuotimento, pop, ripple, stagger e FLIP spariscono; skeleton fermo, spinner → pulsazione; pull to refresh senza trascinamento; la barra delle storie avanza a scatti di 1 s.
- Lo stato non è mai solo movimento o colore: ogni toast ha icona e testo, l'errore ha messaggio e bordo.
- Tutti i bersagli ≥ 44 px, focus riportato all'elemento che ha aperto foglio/dialogo alla chiusura, `Esc` chiude.

### File
`tokens/motion.css` · `vue-starter/motion/`: `motion.js` (`initMotion`, `useReducedMotion`, `useSwipeDismiss`), `PageTransition.vue`, `BottomSheet.vue`, `ModalDialog.vue`, `ToastHost.vue` + `useToast.js`, `StaggerList.vue`, `vShake.js`, `LikeButton.vue`, `PullToRefresh.vue`, `useViewTransition.js`. Compilano con `@vue/compiler-sfc`; non sono ancora provati su dispositivo reale: nell'implementazione verificare swipe e pull su iOS Safari.
Nota: i nomi `--color-*-text` vengono da `tokens.css`; l'attuale `src/assets/main.css` non li ha ancora (si aggiungono con il restyling dei token).

## Meteo e mare (schermate 56-60, riga y=14900 del canvas) — DA APPROVARE PRIMA DI IMPLEMENTARE

Pagina `/meteo` (mobile first, poi desktop) più scheda compatta per la Home. Ogni mockup è in coppia scuro/chiaro e ha il selettore «Anteprima» per gli stati. Screenshot: `56-Meteo-mobile`, `57-Meteo-desktop`, `58-Meteo-luogo`, `59-Meteo-home`, `60-Meteo-componenti` (+ `-chiaro`).

| # | File in `design/` | Contenuto e stati |
|---|---|---|
| 56 | `MeteoMobile` | Selettore **Qui / Cerca un luogo**, luogo + «aggiornato alle HH:MM» + aggiorna; blocchi **Adesso**, **Mare** (onda, onda lunga, mare, corrente se presente, maree stimate 48 h con etichetta «Stima»), **Colpo d'occhio per la pesca** (luna, alba/tramonto, pressione con tendenza e lettura prudente), **Prossime ore** (24/48 h, scroll orizzontale), **Prossimi 7 giorni**. Stati: normale, caricamento (scheletri), offline (banner + «Non aggiornato · dati delle 13:40»), dati parziali («—»), senza mare. |
| 57 | `MeteoDesktop` | Stessa pagina a due colonne con barra laterale: Adesso/Mare affiancati, Colpo d'occhio a tre colonne, tabella 7 giorni. Stati: normale, caricamento, offline, senza mare, errore, posizione negata. |
| 58 | `MeteoLuogo` | Permesso negato, «Come riattivare» (foglio con passi per iPhone/Android/Computer), posizione non trovata, ricerca con suggerimenti (Google), nessun risultato, scelta sulla mappa (pin al centro, coordinate in mono), errore del servizio con «Riprova». |
| 59 | `MeteoHome` | Scheda con 4 dati (temperatura, vento, pressione, onde; senza mare → pioggia) e link «Apri meteo e mare». Stati: normale, caricamento, offline, senza luogo, errore, senza mare. |
| 60 | `MeteoComponenti` | Tendenza pressione (calo, stabile, aumento), vento (freccia + testo «da NO», calmo), fasi lunari. |

### Regole dei dati e dei testi
- Unità: °C, km/h, hPa, metri, secondi. Valore mancante = «—» (mai 0) con `aria-label="dato non disponibile"`.
- Vento: la freccia indica **dove soffia**; il testo dice sempre **da dove arriva** («da NO · 315°», `<abbr title="nord-ovest">`). Calmo = pallino, nessuna freccia.
- Pressione: tre stati con parola + freccia + colore (mai solo colore). La lettura è sempre prudente («spesso accompagna…», «uno spunto, non una previsione»): niente «pesca buona/cattiva».
- Maree: **stima astronomica** (etichetta «Stima» e avviso «non usarla per la navigazione»), grafico con alte/basse e orari, più riepilogo testuale delle prossime 4.
- Senza dati mare (lago, fiume, entroterra): il blocco diventa una riga neutra; in alternativa si può nascondere del tutto. La scheda Home sostituisce «Onde» con «Pioggia».
- Offline: ultimo dato salvato, ora di aggiornamento in evidenza, pulsante aggiorna disabilitato (`aria-disabled`), nessun blocco nascosto.
- Caricamento: solo scheletri (`aria-busy`, testo `role="status"` nascosto), niente spinner a pieno schermo; lo spinner sta solo nel pulsante aggiorna.
- Accessibilità: contrasto AA (verificato come per le altre schermate), bersagli ≥ 44 px, scheda oraria `role="region"` con `tabindex=0` e scorrimento con frecce, grafico maree con `aria-label` riassuntivo, suggerimenti `role="listbox"`.
- Font: Fraunces solo per i titoli (pagina e blocchi), Manrope per i testi, JetBrains Mono per ogni numero (temperature, vento, onde, pressione, orari, percentuali).

### Movimento (usa solo i token di `tokens/motion.css`)
| Elemento | Durata | Easing | Proprietà |
|---|---|---|---|
| Ingresso dei blocchi (primo caricamento) | 200 ms + 40 ms × blocco (max 6) | `--ease-enter` | opacity, translateY 8→0 px (classe `.stagger`) |
| Tendenza pressione: freccia | 320 ms, ritardo 200 | `--ease-spring` | rotate dalla posizione «stabile» a quella finale |
| Tendenza pressione: linea | 320 ms, ritardo 200 | `--ease-enter` | stroke-dashoffset |
| Scheletri → dati | 200 ms | `--ease-standard` | opacity |
| Scheletri (ciclo) | 1400 ms | linear | opacity (pulsazione) |
| Pulsante aggiorna | ciclo 800 ms finché carica | linear | rotate dell'icona |
| Foglio «Come riattivare» | 320 / 200 ms | enter / exit | translateY, sfondo opacity |
| Selettore Qui/Cerca | 200 ms | `--ease-standard` | indicatore translateX |
Con `prefers-reduced-motion` (o «Riduci animazioni» in app): nessuno spostamento, ingresso = dissolvenza ≤ 120 ms, freccia e linea già nella posizione finale, scheletri fermi, aggiorna sostituito da «Aggiorno…». Nessuna informazione dipende dal movimento.

### Implementazione suggerita
- Rotta `/meteo` e scheda `WeatherCard.vue` in Home; store `weather` con cache dell'ultimo dato (localStorage/IndexedDB) per l'offline.
- Backend (da verificare): endpoint proxy `GET /weather?lat&lon` che unisce previsioni e dati marini (onde, swell, temperatura mare, corrente) e restituisce `null` per i campi mancanti; maree calcolate lato server (stima). Suggerimenti luogo con Google Places, chiave solo lato server.
- Da decidere: fonte dati meteo/mare, copertura Adriatico, limiti di richieste, riga neutra o blocco nascosto per «senza mare».

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
