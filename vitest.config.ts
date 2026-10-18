import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Coverage is enforced where the rules live (money, mock services, version gate); screens are covered by Playwright.
// The floors sit just under today's numbers: they stop a regression, they do not claim more than is measured.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/domain/eth.ts', 'src/lib/domain/wallet-rules.ts', 'src/mocks/services/**', 'src/realtime/**', 'src/features/cart/visitorCart.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: {
        'src/mocks/services/**': { lines: 95, functions: 95, branches: 88 },
        'src/realtime/**': { lines: 90, functions: 85, branches: 78 },
        'src/lib/domain/eth.ts': { lines: 95, branches: 88 },
        'src/lib/domain/wallet-rules.ts': { lines: 95, branches: 90 },
      },
    },
  },
})
