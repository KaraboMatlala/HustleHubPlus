import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The Express API runs over HTTPS with a self-signed certificate
// (see the README), hence `secure: false`. Set API_URL if you run it
// elsewhere, e.g. API_URL=http://localhost:4000 npm run dev
const API_URL = process.env.API_URL || 'https://localhost:4000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
