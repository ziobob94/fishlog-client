# fishlog-client

Frontend Vue 3 + Vite per il log delle uscite di pesca.

## Stack
- **Vue 3** (Composition API)
- **Vite** — bundler
- **Pinia** — state management
- **Vue Router 4** — routing SPA
- **Axios** — HTTP client

## Setup

```bash
npm install
cp .env.example .env   # imposta VITE_API_BASE_URL se il server non è su localhost:3001
npm run dev            # http://localhost:5173
```

## .env

| Variabile            | Default                    |
|----------------------|----------------------------|
| `VITE_API_BASE_URL`  | `http://localhost:3001`    |

## Pagine

| Route                  | View                  | Descrizione                              |
|------------------------|-----------------------|------------------------------------------|
| `/`                    | `HomeView`            | Lista uscite con filtri e paginazione    |
| `/new`                 | `NewSessionView`      | Form nuova uscita                        |
| `/session/:id`         | `SessionView`         | Dettaglio completo + upload media        |
| `/session/:id/edit`    | `EditSessionView`     | Modifica uscita esistente                |

## Struttura
```
src/
  main.js
  App.vue             — shell con nav
  router/index.js     — route lazy-loaded
  stores/sessions.js  — Pinia store (CRUD + upload)
  utils/api.js        — istanza Axios (interceptor JWT pronto)
  assets/main.css     — design system globale (dark maritime)
  components/
    SessionForm.vue   — form completo riutilizzabile (new + edit)
    MediaUploader.vue — drag&drop upload, lightbox, delete, caption
  views/
    HomeView.vue
    NewSessionView.vue
    SessionView.vue
    EditSessionView.vue
```

## Build produzione
```bash
npm run build   # output in dist/
```
Puntare il web server (nginx, Caddy...) sulla cartella `dist/` e fare proxy `/api` → server Fastify.

## Futuro
- **Capacitor**: wrappare `dist/` per iOS/Android nativo con `npx cap init`
- **PWA**: aggiungere `vite-plugin-pwa` per offline support e install su mobile
- **Auth**: interceptor JWT già commentato in `utils/api.js`
- **Mappa**: aggiungere Leaflet/MapLibre su `SessionView` per visualizzare le coordinate spot
