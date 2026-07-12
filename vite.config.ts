import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/fampay': {
        target: 'https://py.freepanel.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fampay/, ''),
      }
    }
  }
})
