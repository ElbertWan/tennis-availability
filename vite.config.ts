import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
        rewrite: (p) => p.replace(/^\/hills-api/, '/api'),
      },
      '/tv-api': {
        target: 'https://www.tennisvenues.com.au',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/tv-api/, ''),
      },
    },
  },
})
