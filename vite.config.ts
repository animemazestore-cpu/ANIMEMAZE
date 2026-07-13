import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/fampay-qr': {
        target: 'https://fam.trustupi.site',
        changeOrigin: true,
        rewrite: (path) => {
          const mainPath = path.replace(/^\/api\/fampay-qr/, '/qr');
          const separator = mainPath.includes('?') ? '&' : '?';
          return `${mainPath}${separator}api_key=fmpay_35d11dbd747686931816a3cab1bb67b1b2e92892`;
        },
      },
      '/api/fampay-verify': {
        target: 'https://fam.trustupi.site',
        changeOrigin: true,
        rewrite: (path) => {
          const mainPath = path.replace(/^\/api\/fampay-verify/, '/verify_order');
          const separator = mainPath.includes('?') ? '&' : '?';
          return `${mainPath}${separator}api_key=fmpay_35d11dbd747686931816a3cab1bb67b1b2e92892`;
        },
      },
    },
  },
})
