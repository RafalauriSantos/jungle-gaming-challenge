import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
const sourceFiles = (dir: string) => walk(dir).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
const read = (f: string) => readFileSync(f, 'utf8')
const outside = (dir: string) => sourceFiles('src').filter((f) => !f.startsWith(`${dir}/`))

describe('the network layer is Axios and the mock sits behind it', () => {
  it('API-3#1: no code but the mock calls fetch or XMLHttpRequest; only the API client creates an Axios instance', () => {
    const raw = outside('src/mocks').filter((f) => /\bfetch\(|XMLHttpRequest/.test(read(f)))
    expect(raw).toEqual([])
    const instances = sourceFiles('src').filter((f) => /axios\.create\(/.test(read(f)))
    expect(instances).toEqual(['src/api/client.ts'])
  })

  it('API-2#1: screens reach the server only through the query hooks of src/api, never through the HTTP instance', () => {
    const callers = outside('src/api')
      .filter((f) => !f.startsWith('src/mocks/'))
      .filter((f) => /\b(api|axios)\.(get|post|put|patch|delete|request)\(/.test(read(f)))
    expect(callers).toEqual([])
  })

  it('MOCK-1#1: nothing outside the mock imports it, except the boot code of main.tsx', () => {
    const importing = outside('src/mocks').filter((f) => /['"](@\/mocks|\.{1,2}\/(\.\.\/)*mocks)[/'"]/.test(read(f)))
    expect(importing).toEqual(['src/main.tsx'])
  })

  it('MOCK-10#1: tests run against the built app and its handlers; none stubs the network itself', () => {
    const stubbing = walk('e2e').filter((f) => /\.tsx?$/.test(f) && /\.route\(|routeFromHAR|route\.fulfill/.test(read(f)))
    expect(stubbing).toEqual([])
    const browser = read('src/mocks/browser.ts')
    expect(browser).toMatch(/setupWorker\(\.\.\.handlers/)
  })
})

describe('contracts and test isolation', () => {
  it('API-4#1: TypeScript runs in strict mode for the app and the unit tests', () => {
    expect(read('tsconfig.app.json')).toMatch(/"strict":\s*true/)
    expect(read('tsconfig.test.json')).toMatch(/tsconfig\.app\.json/)
  })

  it('TEST-4#1: E2E tests run in parallel and none is serial, so none can lean on another', () => {
    expect(read('playwright.config.ts')).toMatch(/fullyParallel:\s*true/)
    const serial = walk('e2e').filter((f) => /\.tsx?$/.test(f) && /describe\.serial|mode:\s*'serial'/.test(read(f)))
    expect(serial).toEqual([])
  })
})
