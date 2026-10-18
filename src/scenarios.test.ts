import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
const read = (f: string) => readFileSync(f, 'utf8')

describe('the twelve scenarios of the statement', () => {
  it('TEST-1#1: each scenario of Appendix A has an E2E test that names one of its requirements', () => {
    // Only what a test is called counts: a requirement named in a comment or an import proves nothing.
    const titles = walk('e2e')
      .filter((f) => f.endsWith('.spec.ts'))
      .flatMap((f) => [...read(f).matchAll(/\btest\(\s*([`'"])(.*?)\1\s*,/g)].map((m) => m[2]))
      .join('\n')
    const rows = read('docs/spec/design-decisions.md').split('## Appendix A')[1]!.split('\n').filter((l) => /^\| E\d+ \|/.test(l))
    expect(rows).toHaveLength(12)
    const expand = (token: string): string[] => {
      const range = token.match(/^(.*?)(\d+)\.\.S?(\d+)$/)
      if (!range) return [token]
      const [, head, from, to] = range
      return Array.from({ length: +to! - +from! + 1 }, (_, i) => `${head}${String(+from! + i).padStart(from!.length, '0')}`)
    }
    const uncovered = rows
      .map((row) => ({ id: row.split('|')[1]!.trim(), ids: row.split('|')[3]!.split(',').map((t) => t.trim()).flatMap(expand) }))
      .filter(({ ids }) => !ids.some((id) => titles.includes(`${id}#`)))
      .map(({ id }) => id)
    expect(uncovered).toEqual([])
  })
})
