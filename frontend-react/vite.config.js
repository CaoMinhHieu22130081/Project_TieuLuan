import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    host: 'localhost',
    strictPort: false,
    hmr: {
      host: 'localhost',
      port: 5176,
      protocol: 'ws',
    },
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'sockjs-client': 'sockjs-client/dist/sockjs.min.js',
    }
  }
})

