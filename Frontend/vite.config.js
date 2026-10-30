import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev (npm run dev): /api ki requests backend ko forward hoti hain.
// Backend ka URL badalna ho to: VITE_PROXY_TARGET=http://localhost:5000 npm run dev
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
