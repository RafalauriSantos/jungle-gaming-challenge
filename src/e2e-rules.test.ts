import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('time-sensitive E2E tests do not wait on the wall clock', () => {
  it('TEST-5#1: never sleeps: they wait for an observable signal, or move the clock they own', () => {
    const files = readdirSync('e2e').filter((f) => f.endsWith('.ts'))
    const sleeping = files.filter((f) => /waitForTimeout\(/.test(readFileSync(`e2e/${f}`, 'utf8')))
    expect(sleeping).toEqual([])
  })
})
