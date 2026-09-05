import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

export default createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/login',          name: 'login',         component: () => import('../views/LoginView.vue'),        meta: { public: true } },
    { path: '/register',       name: 'register',      component: () => import('../views/RegisterView.vue'),     meta: { public: true } },
    { path: '/auth/callback',  name: 'auth-callback', component: () => import('../views/AuthCallbackView.vue'), meta: { public: true } },
    { path: '/forgot-password', name: 'forgot-password', component: () => import('../views/ForgotPasswordView.vue'), meta: { public: true } },
    { path: '/reset-password',  name: 'reset-password',  component: () => import('../views/ResetPasswordView.vue'),  meta: { public: true } },
    { path: '/confirm-email',   name: 'confirm-email',   component: () => import('../views/ConfirmEmailView.vue'),   meta: { public: true } },
    { path: '/',               name: 'home',          component: () => import('../views/HomeView.vue') },
    { path: '/sessions',       name: 'sessions',      component: () => import('../views/SessionsView.vue') },
    { path: '/new',            name: 'new-session',   component: () => import('../views/NewSessionView.vue') },
    { path: '/session/:id',    name: 'session',       component: () => import('../views/SessionView.vue') },
    { path: '/session/:id/edit', name: 'edit-session', component: () => import('../views/EditSessionView.vue') },
    { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue'), meta: { role: 'admin' } },
    { path: '/groups', name: 'groups', component: () => import('../views/GroupsView.vue') },
    { path: '/friends', name: 'friends', component: () => import('../views/FriendsView.vue') },
    { path: '/users/:id', name: 'user-profile', component: () => import('../views/UserProfileView.vue') },
    { path: '/feed',  name: 'feed',  component: () => import('../views/FeedView.vue') },
    { path: '/board', name: 'board', component: () => import('../views/MyBoardView.vue') },
    { path: '/market', name: 'market', component: () => import('../views/MarketView.vue') },
    { path: '/chat',   name: 'chat',   component: () => import('../views/ChatView.vue') },
    { path: '/chat/:userId', name: 'chat-thread', component: () => import('../views/ChatView.vue') },
    { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue') },
    { path: '/stats',   name: 'stats',   component: () => import('../views/StatsView.vue') },
  ]
})

// Navigation guard — route senza meta.public richiedono auth
export function setupGuards(router) {
    router.beforeEach((to) => {
      const auth = useAuthStore()
      if (!to.meta.public && !auth.isLoggedIn) return '/login'
      if (to.meta.role && auth.user?.role !== to.meta.role) return '/'
    })
}