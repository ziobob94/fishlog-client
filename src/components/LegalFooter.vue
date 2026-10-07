<template>
  <footer class="site-footer">
    <div class="footer-cols">
      <div class="footer-brand">
        <p class="footer-logo icon-inline"><Fish :size="18" /> FishLog</p>
        <p class="text-muted">{{ t('footer.tagline') }}</p>
      </div>

      <nav v-if="auth.isLoggedIn" class="footer-col">
        <h4>{{ t('footer.explore') }}</h4>
        <RouterLink to="/species">{{ t('nav.species') }}</RouterLink>
        <RouterLink to="/sessions">{{ t('nav.sessions') }}</RouterLink>
        <RouterLink to="/stats">{{ t('nav.stats') }}</RouterLink>
        <RouterLink to="/classifica">{{ t('nav.leaderboard') }}</RouterLink>
      </nav>

      <nav v-if="auth.isLoggedIn" class="footer-col">
        <h4>{{ t('footer.community') }}</h4>
        <RouterLink to="/feed">{{ t('nav.feed') }}</RouterLink>
        <RouterLink to="/groups">{{ t('nav.groups') }}</RouterLink>
        <RouterLink to="/market">{{ t('nav.market') }}</RouterLink>
        <RouterLink to="/chat">{{ t('nav.chat') }}</RouterLink>
      </nav>

      <nav class="footer-col">
        <h4>{{ t('footer.legal') }}</h4>
        <RouterLink to="/privacy-policy">Privacy</RouterLink>
        <RouterLink to="/termini">Termini</RouterLink>
        <RouterLink to="/cookie-policy">Cookie</RouterLink>
      </nav>
    </div>

    <p class="footer-note">{{ t('footer.note') }}</p>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'

const { t } = useI18n()
const auth = useAuthStore()
</script>

<style scoped>
.site-footer { @apply border-t border-border/60 bg-surface px-6 py-6 text-xs; }
.footer-cols { @apply max-w-[1100px] mx-auto grid gap-6; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.footer-brand { @apply flex flex-col gap-1; grid-column: span 2; }
.footer-logo { @apply text-base font-extrabold text-foam; }
.icon-inline { @apply inline-flex items-center gap-1.5; }
.footer-col { @apply flex flex-col gap-1.5; }
.footer-col h4 { @apply text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1; }
.footer-col a { @apply text-foam hover:text-ocean; }
.footer-note { @apply max-w-[1100px] mx-auto mt-5 text-muted; }
@media (max-width: 640px) { .footer-brand { grid-column: 1 / -1; } }
</style>
