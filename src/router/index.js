import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

export default createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/login',          name: 'login',         component: () => import('../views/LoginView.vue'),        meta: { public: true } },
    { path: '/register',       name: 'register',      component: () => import('../views/RegisterView.vue'),     meta: { public: true } },
    { path: '/auth/callback',  name: 'auth-callback', component: () => import('../views/AuthCallbackView.vue'), meta: { public: true } },
    { path: '/',               name: 'home',          component: () => import('../views/HomeView.vue') },
    { path: '/new',            name: 'new-session',   component: () => import('../views/NewSessionView.vue') },
    { path: '/session/:id',    name: 'session',       component: () => import('../views/SessionView.vue') },
    { path: '/session/:id/edit', name: 'edit-session', component: () => import('../views/EditSessionView.vue') },
    { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue'), meta: { role: 'admin' } },
    { path: '/groups', name: 'groups', component: () => import('../views/GroupsView.vue') },
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