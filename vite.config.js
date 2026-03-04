import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v0': {
        target: 'https://play.tennis.com.au',
        changeOrigin: true,
        secure: true,
      },
      '/hills-api': {
        target: 'https://hills-prod.bookable.net.au',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hills-api/, '/api'),
      },
      '/tv-api': {
        target: 'https://www.tennisvenues.com.au',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/tv-api/, ''),
      },
    },
  },
})
