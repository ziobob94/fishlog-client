import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

// Profondità per le transizioni di pagina: 0 = voci della barra (meta.tab),
// 1 = dettagli e pagine di primo livello, 2 = sotto-pagine (modifica, cattura,
// chiusura, nuovo gruppo...). Si ricava dal percorso così resta coerente.
const SUB = /\/(edit|close|catch\/|group\/new|sell)/
function withDepth(routes) {
  return routes.map(r => {
    const meta = { ...(r.meta || {}) }
    if (!meta.public && meta.depth == null) meta.depth = meta.tab ? 0 : (SUB.test(r.path) ? 2 : 1)
    return { ...r, meta }
  })
}

export default createRouter({
  history: createWebHistory(),
  // Ripristina la posizione salvata tornando indietro, altrimenti in cima;
  // si attende la fine della dissolvenza di uscita per non far "saltare"
  // la pagina che sta uscendo.
  scrollBehavior: (to, from, saved) => new Promise(resolve => setTimeout(() => resolve(saved || { top: 0 }), 120)),
  routes: withDepth([
    { path: '/login',          name: 'login',         component: () => import('../views/LoginView.vue'),        meta: { public: true } },
    { path: '/register',       name: 'register',      component: () => import('../views/RegisterView.vue'),     meta: { public: true } },
    { path: '/auth/callback',  name: 'auth-callback', component: () => import('../views/AuthCallbackView.vue'), meta: { public: true } },
    { path: '/forgot-password', name: 'forgot-password', component: () => import('../views/ForgotPasswordView.vue'), meta: { public: true } },
    { path: '/reset-password',  name: 'reset-password',  component: () => import('../views/ResetPasswordView.vue'),  meta: { public: true } },
    { path: '/confirm-email',   name: 'confirm-email',   component: () => import('../views/ConfirmEmailView.vue'),   meta: { public: true } },
    { path: '/privacy-policy', name: 'privacy-policy', component: () => import('../views/legal/PrivacyView.vue'), meta: { public: true } },
    { path: '/gare/p/:slug', name: 'fipsas-public', component: () => import('../views/fipsas/FipsasPublicView.vue'), meta: { public: true } },
    { path: '/termini',        name: 'terms',          component: () => import('../views/legal/TermsView.vue'),   meta: { public: true } },
    { path: '/cookie-policy',  name: 'cookie-policy',  component: () => import('../views/legal/CookieView.vue'),  meta: { public: true } },
    { path: '/',               name: 'home',          component: () => import('../views/HomeView.vue'), meta: { tab: true } },
    { path: '/meteo',          name: 'weather',       component: () => import('../views/WeatherPage.vue'), meta: { ownHeader: true } },
    { path: '/meteo/giorno/:date', name: 'weather-day', component: () => import('../views/WeatherDayPage.vue'), meta: { ownHeader: true, depth: 2 } },
    { path: '/sessions',       name: 'sessions',      component: () => import('../views/SessionsView.vue'), meta: { ownHeader: true, tab: true } },
    { path: '/new',            name: 'new-session',   component: () => import('../views/NewSessionView.vue'), meta: { ownHeader: true } },
    { path: '/session/:id',    name: 'session',       component: () => import('../views/SessionView.vue'), meta: { ownHeader: true } },
    { path: '/session/:id/edit', name: 'edit-session', component: () => import('../views/EditSessionView.vue'), meta: { ownHeader: true, hideBottomNav: true } },
    { path: '/session/:id/catch/:index', name: 'session-catch', component: () => import('../views/CatchFormView.vue'), meta: { ownHeader: true, hideBottomNav: true } },
    { path: '/session/:id/close', name: 'close-session', component: () => import('../views/CloseSessionView.vue'), meta: { ownHeader: true, hideBottomNav: true } },
    { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue'), meta: { role: 'admin' } },
    { path: '/groups', name: 'groups', component: () => import('../views/GroupsView.vue'), meta: { ownHeader: true } },
    { path: '/friends', name: 'friends', component: () => import('../views/FriendsView.vue'), meta: { ownHeader: true } },
    { path: '/users/:id', name: 'user-profile', component: () => import('../views/UserProfileView.vue'), meta: { ownHeader: true } },
    { path: '/utenti/:id/catture', name: 'user-catches', component: () => import('../views/CatchesRankingPage.vue'), meta: { ownHeader: true } },
    { path: '/story/new', name: 'story-new', component: () => import('../views/StoryComposerView.vue'), meta: { ownHeader: true, hideBottomNav: true } },
    { path: '/post/new', name: 'post-new', component: () => import('../views/PostComposeView.vue'), meta: { ownHeader: true, hideBottomNav: true } },
    { path: '/stories/:userId', name: 'story-view', component: () => import('../views/StoryViewerView.vue'), meta: { ownHeader: true, hideBottomNav: true, sameView: true } },
    { path: '/feed',  name: 'feed',  component: () => import('../views/FeedView.vue'), meta: { ownHeader: true, fullHeight: true, tab: true } },
    { path: '/board', name: 'board', component: () => import('../views/MyBoardView.vue'), meta: { ownHeader: true } },
    { path: '/market', name: 'market', component: () => import('../views/MarketView.vue'), meta: { ownHeader: true, tab: true } },
    { path: '/market/mine', name: 'market-mine', component: () => import('../views/MyListingsView.vue'), meta: { ownHeader: true } },
    { path: '/market/sell', name: 'market-sell', component: () => import('../views/SellerView.vue'), meta: { ownHeader: true } },
    { path: '/market/new', name: 'market-new', component: () => import('../views/NewListingView.vue'), meta: { ownHeader: true, hideBottomNav: true } },
    { path: '/market/shop/:userId', name: 'market-shop', component: () => import('../views/ShopView.vue') },
    { path: '/market/:id', name: 'market-listing', component: () => import('../views/ListingView.vue') },
    { path: '/market/:id/edit', name: 'market-listing-edit', component: () => import('../views/EditListingView.vue'), meta: { ownHeader: true, hideBottomNav: true } },
    { path: '/chat',   name: 'chat',   component: () => import('../views/ChatView.vue'), meta: { ownHeader: true } },
    { path: '/chat/group/new', name: 'chat-group-new', component: () => import('../views/NewGroupView.vue'), meta: { ownHeader: true, hideBottomNav: true } },
    { path: '/chat/group/:conversationId', name: 'chat-group', component: () => import('../views/GroupChatView.vue'), meta: { ownHeader: true, fullHeight: true, hideBottomNav: true } },
    { path: '/chat/:userId', name: 'chat-thread', component: () => import('../views/ChatView.vue'), meta: { ownHeader: true, fullHeight: true, hideBottomNav: true } },
    { path: '/notifications', name: 'notifications', component: () => import('../views/NotificationsView.vue'), meta: { ownHeader: true } },
    { path: '/profile/edit', name: 'profile-edit', component: () => import('../views/ProfileSettingsView.vue'), meta: { ownHeader: true, hideBottomNav: true } },
    { path: '/post/:id', name: 'post-detail', component: () => import('../views/PostDetailView.vue'), meta: { ownHeader: true } },
    { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { ownHeader: true } },
    { path: '/stats',   name: 'stats',   component: () => import('../views/StatsView.vue'), meta: { ownHeader: true } },
    { path: '/species', name: 'species-search', component: () => import('../views/SpeciesSearchView.vue'), meta: { ownHeader: true } },
    { path: '/species/:name', name: 'species', component: () => import('../views/SpeciesView.vue') },
    { path: '/gare', name: 'gare', component: () => import('../views/fipsas/FipsasListView.vue'), meta: { ownHeader: true } },
    { path: '/gare/:id/:sezione?', name: 'gare-prova', component: () => import('../views/fipsas/FipsasProvaView.vue'), meta: { ownHeader: true, hideBottomNav: true, depth: 1 } },
    { path: '/classifica', name: 'leaderboard', component: () => import('../views/LeaderboardView.vue'), meta: { ownHeader: true } },
  ])
})

// Navigation guard — route senza meta.public richiedono auth
export function setupGuards(router) {
    router.beforeEach((to) => {
      const auth = useAuthStore()
      if (!to.meta.public && !auth.isLoggedIn) return '/login'
      if (to.meta.role && auth.user?.role !== to.meta.role) return '/'
    })

    // Una navigazione riuscita azzera il flag, cosi un futuro chunk error puo ritentare
    router.afterEach(() => {
      sessionStorage.removeItem('chunk-reload-attempted')
    })

    // Dopo un nuovo deploy i vecchi chunk (hash cambiato) spariscono dal server:
    // se il browser ha ancora l'index.html/JS vecchio in cache, l'import dinamico
    // fallisce. Ricarichiamo la pagina una sola volta per recuperare i chunk nuovi.
    router.onError((error, to) => {
      const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(error?.message || '')
      if (!isChunkError) return

      const key = 'chunk-reload-attempted'
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
      window.location.href = to.fullPath
    })
}