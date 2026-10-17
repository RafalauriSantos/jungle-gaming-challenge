import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sources(path) : [path]
  })

describe('MON-1#2: no floating point on money', () => {
  it('MON-1#2: keeps float parsing and rounding out of the source', () => {
    const files = sources('src').filter(
      (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith('routeTree.gen.ts'),
    )
    const offenders = files.flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      const hits = [/parseFloat\(/, /\.toFixed\(/, /Number\([^)]*(price|Price|total|Total|fee|Fee|subtotal|discount|amount)/].filter((re) =>
        re.test(text),
      )
      return hits.map((re) => `${file}: ${re}`)
    })
    expect(offenders).toEqual([])
  })
})
