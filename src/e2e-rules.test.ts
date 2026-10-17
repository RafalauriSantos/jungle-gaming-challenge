import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { PRIVATE_API, PUBLIC_API } from '../e2e/private-api'
import { describe, expect, it } from 'vitest'

describe('time-sensitive E2E tests do not wait on the wall clock', () => {
  it('TEST-5#1: never sleeps: they wait for an observable signal, or move the clock they own', () => {
    const files = readdirSync('e2e').filter((f) => f.endsWith('.ts'))
    const sleeping = files.filter((f) => /waitForTimeout\(/.test(readFileSync(`e2e/${f}`, 'utf8')))
    expect(sleeping).toEqual([])
  })
})

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
const sourceFiles = (dir: string) => walk(dir).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))

// DQ-5: a real-time change must travel from the mock backend through the Socket.IO connection to the app,
// never by writing to the cache or the stores from a test or from the mock.
describe('events reach the UI only through the socket', () => {
  it('TEST-7#1: no E2E test writes to the query cache or the session store', () => {
    const touching = walk('e2e')
      .filter((f) => /\.tsx?$/.test(f))
      .filter((f) => /setQueryData|setQueriesData|queryClient|QueryClient|setSession\(|clearSession\(|beginSession\(/.test(readFileSync(f, 'utf8')))
    expect(touching).toEqual([])
  })

  it('TEST-7#1: the mock backend does not import the query cache, the real-time client or the session store', () => {
    const importing = sourceFiles('src/mocks').filter((f) => /from '(@tanstack\/react-query|@\/realtime[^']*|@\/session[^']*)'/.test(readFileSync(f, 'utf8')))
    expect(importing).toEqual([])
  })

  it('TEST-7#1: the only global hook for tests is window.__mock, set by the mock entry', () => {
    const hooks = sourceFiles('src').filter((f) => /\b(window|globalThis)\.__\w+\s*=/.test(readFileSync(f, 'utf8')))
    expect(hooks).toEqual(['src/mocks/browser.ts'])
  })
})

// AUTH-9: the E2E list of private endpoints cannot drift from the handlers the mock registers.
describe('the private API list matches the mock handlers', () => {
  it('AUTH-9#1: every handler is listed as private or as public, and nothing else is listed', () => {
    const registered = sourceFiles('src/mocks/handlers')
      .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/http\.(get|post|put|patch|delete)\(\s*[`']([^`']+)[`']/g)])
      .flatMap(([, method, path]) => (path!.includes('${slot}') ? ['primary', 'secondary'].map((slot) => [method!, path!.replace('${slot}', slot)]) : [[method!, path!]]))
      .map(([method, path]) => `${method!.toUpperCase()} ${path}`)
      .sort()
    const listed = [...PRIVATE_API, ...PUBLIC_API].map(([method, path]) => `${method} ${path}`).sort()
    expect(listed).toEqual(registered)
  })
})
