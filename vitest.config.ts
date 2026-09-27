import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
    },
    // Satu instance Vue saja: node_modules berisi dua salinan vue (top-level 3.5.30
    // dan .pnpm 3.5.42), sehingga getCurrentInstance() di dalam lib .pnpm (mis.
    // @vueuse/core yang dipakai reka-ui) mengembalikan null dan portal tidak render.
    dedupe: ['vue'],
  },
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        // Lib ini harus di-inline agar Vite (bukan resolver native Node) yang
        // me-resolve `vue`; kalau di-external, Node mengambil vue@3.5.42 di dalam
        // .pnpm sehingga instance Vue berbeda dari milik test/renderer.
        inline: ['reka-ui', '@vueuse/core'],
      },
    },
  },
})
