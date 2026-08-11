import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'assets/**/*.png', 'assets/**/*.svg', 'assets/**/*.jpg'],
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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      }
    })
  ]
})