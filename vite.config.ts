import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/fampay-qr': {
        target: 'https://py.freepanel.in',
        changeOrigin: true,
        rewrite: (path) => {
          const mainPath = path.replace(/^\/api\/fampay-qr/, '/qr');
          const separator = mainPath.includes('?') ? '&' : '?';
          return `${mainPath}${separator}api_key=fmpay_c0deedbc77d3d29dfbac858498bfd10d262a48a2`;
        },
      },
      '/api/fampay-verify': {
        target: 'https://py.freepanel.in',
        changeOrigin: true,
        rewrite: (path) => {
          const mainPath = path.replace(/^\/api\/fampay-verify/, '/verify_order');
          const separator = mainPath.includes('?') ? '&' : '?';
          return `${mainPath}${separator}api_key=fmpay_c0deedbc77d3d29dfbac858498bfd10d262a48a2`;
        },
      },
    },
  },
})
