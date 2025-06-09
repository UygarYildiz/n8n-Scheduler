import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/webhook': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  define: {
    // Environment variables için
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? process.env.VITE_API_URL || 'https://optimization-api.railway.app'
        : 'http://localhost:8000'
    ),
    'process.env.VITE_N8N_URL': JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? process.env.VITE_N8N_URL || 'https://optimization-n8n.railway.app'
        : 'http://localhost:5678'
    )
  }
})
