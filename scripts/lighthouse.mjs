// Lighthouse runner. Usage: node scripts/lighthouse.mjs [--runs 3] [--url http://localhost:4173] [--out dir]
// Writes HTML and JSON per run to reports/lighthouse/ and prints the median of each metric.
import { chromium } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}
const base = arg('url', 'http://localhost:4173')
const runs = Number(arg('runs', '1'))
const PAGES = { home: '/' } // detail joins when the route is built (M2)
const PROFILES = { mobile: [], desktop: ['--preset=desktop'] }
const OUT = arg('out', 'reports/lighthouse')
mkdirSync(OUT, { recursive: true })

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const METRICS = { 'largest-contentful-paint': 'LCP ms', 'cumulative-layout-shift': 'CLS', 'total-blocking-time': 'TBT ms' }
const env = { ...process.env, CHROME_PATH: chromium.executablePath() }

for (const [page, path] of Object.entries(PAGES)) {
  for (const [profile, flags] of Object.entries(PROFILES)) {
    const results = []
    for (let n = 1; n <= runs; n++) {
      const file = `${OUT}/${page}-${profile}-${n}`
      const r = spawnSync(
        'pnpm',
        ['exec', 'lighthouse', base + path, ...flags, '--output=json', '--output=html', `--output-path=${file}`,
          '--chrome-flags=--headless=new --no-sandbox', '--quiet'],
        { env, stdio: 'inherit' },
      )
      if (r.status !== 0) process.exit(r.status ?? 1)
      results.push(JSON.parse(readFileSync(`${file}.report.json`, 'utf8')))
    }
    const scores = Object.fromEntries(
      ['performance', 'accessibility', 'best-practices', 'seo'].map((c) => [c, median(results.map((r) => Math.round(r.categories[c].score * 100)))]),
    )
    const metrics = Object.fromEntries(
      Object.entries(METRICS).map(([id, label]) => [label, median(results.map((r) => r.audits[id].numericValue))]),
    )
    console.log(`${page} ${profile} (${runs === 1 ? 'initial measurement' : `median of ${runs}`})`, scores, metrics)
  }
}
