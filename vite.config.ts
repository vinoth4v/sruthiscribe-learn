import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES_BASE || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // App-shell + lesson-data caching only (build plan §9 Phase 6: "offline
      // lesson playback for cached lessons"). Attempt writes are handled by
      // src/lib/offlineQueue.ts, not the service worker -- Supabase POSTs
      // need app-level retry/merge logic a generic SW cache can't provide.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rest/v1/') || url.host.endsWith('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-reads',
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'SruthiScribe Learn',
        short_name: 'SS Learn',
        description: 'Carnatic music learning app — practice svaras with real-time feedback.',
        theme_color: '#b23b2e',
        background_color: '#fdfaf5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
