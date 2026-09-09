<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast-${t.type}`" @click="dismiss(t.id)">
          <component :is="ICONS[t.type]" :size="16" class="toast-icon" />
          <span class="toast-text">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { AlertTriangle, CheckCircle2, Info } from 'lucide-vue-next'
import { useToast } from '../composables/useToast.js'

const { toasts, dismiss } = useToast()

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle
}
</script>

<style scoped>
.toast-stack {
  bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  left: 50%;
  max-width: calc(100vw - 2rem);
  position: fixed;
  transform: translateX(-50%);
  z-index: 2000;
}

/* Sotto i 768px (stessa soglia della bottom nav mobile, vedi
   AppBottomNav.vue) i toast partirebbero da sotto la barra fissa: li
   alziamo di conseguenza, includendo l'eventuale safe-area del device. */
@media (max-width: 767px) {
  .toast-stack {
    bottom: calc(var(--bottom-nav-h) + 0.75rem + env(safe-area-inset-bottom));
  }
}

.toast {
  align-items: center;
  background: var(--surface, #0a1929);
  border: 1px solid var(--border, #2a3f55);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .35);
  cursor: pointer;
  display: flex;
  gap: .55rem;
  padding: .7rem .9rem;
  width: max-content;
  max-width: 100%;
}

.toast-text { color: var(--foam, #cde); font-size: .85rem; line-height: 1.35; }
.toast-icon { flex-shrink: 0; }

.toast-info     .toast-icon { color: var(--ocean, #0ea5e9); }
.toast-success  .toast-icon { color: var(--success, #5cd98a); }
.toast-warning  .toast-icon,
.toast-danger   .toast-icon { color: var(--sand, #f0a040); }

.toast-warning, .toast-danger { border-color: var(--sand, #f0a040); }

.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
