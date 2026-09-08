import { defineStore } from 'pinia'

const STORAGE_KEY = 'fishlog_theme'

function systemPreference() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode)
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: localStorage.getItem(STORAGE_KEY) || systemPreference()
  }),
  actions: {
    init() {
      applyTheme(this.mode)
    },
    setMode(mode) {
      if (mode !== 'light' && mode !== 'dark') return
      this.mode = mode
      localStorage.setItem(STORAGE_KEY, mode)
      applyTheme(mode)
    }
  }
})
