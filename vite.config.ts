import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: false }), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // The mock does not use cookies: keep MSW's cookie jar and its public-suffix list out of the build.
      'tough-cookie': path.resolve(import.meta.dirname, 'src/mocks/stubs/tough-cookie.ts'),
    },
  },
})
