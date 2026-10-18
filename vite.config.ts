import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// The stylesheet is small (about 15 KB) and blocks first paint, so the build puts it in the page: one request less before the first draw.
const inlineCss = (): Plugin => ({
  name: 'inline-css',
  apply: 'build',
  enforce: 'post',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      return html.replace(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g, (tag, href: string) => {
        const file = ctx.bundle?.[href.replace(/^\//, '')]
        return file && file.type === 'asset' ? `<style>${String(file.source)}</style>` : tag
      })
    },
  },
})

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: false }), react(), tailwindcss(), inlineCss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // The mock does not use cookies: keep MSW's cookie jar and its public-suffix list out of the build.
      'tough-cookie': path.resolve(import.meta.dirname, 'src/mocks/stubs/tough-cookie.ts'),
    },
  },
})
