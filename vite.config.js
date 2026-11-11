import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  define: { __APP_BUILD__: JSON.stringify(new Date().toISOString()) },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: { port: 5173 }
})