import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_BACKEND_URL || 'http://localhost:3000'
  const frontPort = Number(env.VITE_FRONT_PORT || 5173)

  return {
    plugins: [react()],
    server: {
      host: true,
      port: Number.isFinite(frontPort) ? frontPort : 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        }
      }
    }
  }
})

