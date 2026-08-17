import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/cap-tracker/',
  server: {
    // Listen on the LAN so a real iPhone on the same WiFi can load the dev
    // server directly (Settings > WiFi > (i) on the phone to find the Mac's
    // address, or just use the "Network:" URL vite prints on startup).
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: "Andy's Cap Tracker",
        short_name: 'Cap Tracker',
        description: 'Prospective cadet recruiting tracker',
        theme_color: '#0D2B55',
        background_color: '#0D2B55',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/cap-tracker/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
});
