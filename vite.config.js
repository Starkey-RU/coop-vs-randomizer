import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'HD2 Attrition Protocol',
        short_name: 'HD2 Attrition',
        description: 'Randomizer & Draft App for Helldivers 2',
        theme_color: '#0D0D12',
        background_color: '#0D0D12',
        icons: [
          {
            src: 'assets/stratagems/SOS_Beacon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'assets/stratagems/SOS_Beacon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico}'],
        globIgnores: ['**/assets/images/**', '**/assets/stratagems/**', '**/armor/**', '**/passive_armor/**'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hd2-game-assets',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})