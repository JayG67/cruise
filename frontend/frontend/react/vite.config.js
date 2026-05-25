import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'frontend/react',
  plugins: [react()],
  server: {
    proxy: {
      '/cruise': 'http://localhost:8000',
      '/health': 'http://localhost:8000'
    }
  },
  build: {
    outDir: '../../dist/react',
    emptyOutDir: true
  }
})
