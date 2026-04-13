import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

function normalizeBase(input: string | undefined) {
  const value = input?.trim()
  if (!value || value === '/') return '/'
  return `/${value.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig(({ command }) => ({
  // Standalone Cloudflare Pages deploys should build for domain root.
  // Legacy unified nginx deploys can override this with VITE_APP_BASE=/crm/.
  base: command === 'build' ? normalizeBase(process.env.VITE_APP_BASE) : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: { port: 5174 }
}))
