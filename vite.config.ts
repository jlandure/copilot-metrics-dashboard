import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // Mirror the nginx reverse proxy so /github-api works in dev too,
      // letting the billing page call the GitHub REST API without CORS issues.
      '/github-api': {
        target: 'https://api.github.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/github-api/, '')
      }
    }
  }
})
