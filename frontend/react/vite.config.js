import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const backendTarget = process.env.REACT_API_PROXY_TARGET || 'http://localhost:8000'

const apiProxy = {
  '/cruise': {
    target: backendTarget,
    changeOrigin: true
  },
  '/health': {
    target: backendTarget,
    changeOrigin: true
  },
  '/admin': {
    target: backendTarget,
    changeOrigin: true
  },
  '/data': {
    target: backendTarget,
    changeOrigin: true
  }
}

export default defineConfig({
  base: '/',
  root: 'frontend/react',
  publicDir: path.resolve(__dirname, '../../public'),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: apiProxy
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy: apiProxy
  },
  build: {
    outDir: '../../dist/react',
    emptyOutDir: true
  }
})
