import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  // data/ klasöründeki MP3'leri public asset olarak serve et
  publicDir: '../data',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,   // 0.0.0.0 — yerel ağdan erişim için
    open: true,
  },
})