import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Caisse Émergence',
        short_name: 'Caisse Émergence',
        description: 'Épargne, crédit et solidarité — Caisse Émergence',
        lang: 'fr',
        theme_color: '#09324e',
        background_color: '#09324e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Précache l'app shell (HTML/JS/CSS/icônes) pour un lancement
        // hors-ligne ; les appels API restent toujours en ligne (données
        // sensibles et changeantes), avec repli déjà géré côté app sur le
        // cache local pour cotisations/prêts/aides.
        globPatterns: ['**/*.{js,css,html,svg,png,jpeg,jpg}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
