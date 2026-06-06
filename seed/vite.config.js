import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path when deployed through Eleventy:
//   Eleventy passthrough: seed/dist/ → _site/seed/dist/
//   Web URL prefix for all built assets: /seed/dist/
// Override with VITE_BASE=/ for standalone `npm run dev`.
const base = process.env.VITE_BASE ?? '/seed/dist/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Predictable names so seed/index.njk can hard-reference them
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
