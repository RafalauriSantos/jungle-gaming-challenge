import { describe, expect, it } from 'vitest'
import { applyBootParams } from './boot'
import { createDb, memoryStorage } from './db'

const clientStorage = (entries: Record<string, string>) => {
  const map = new Map(Object.entries(entries))
  return {
    get length() {
      return map.size
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    keys: () => [...map.keys()],
  }
}

describe('boot parameters', () => {
  it('selects a known scenario and strips the parameter', () => {
    const db = createDb(memoryStorage())
    const result = applyBootParams(db, '?q=ape&scenario=slow', [clientStorage({})])
    expect(db.state.scenario).toBe('slow')
    expect(result.search).toBe('?q=ape')
  })

  it('ignores an unknown scenario', () => {
    const db = createDb(memoryStorage())
    applyBootParams(db, '?scenario=nope', [clientStorage({})])
    expect(db.state.scenario).toBe('success')
  })

  it('MOCK-3#1: reset also clears the tab storage: the coupon and the checkout draft do not survive it', () => {
    const db = createDb(memoryStorage())
    const local = clientStorage({ 'kurio.session': '{}', 'kurio.mock.db': '{}' })
    const tab = clientStorage({ 'kurio.u_ana.coupon': 'KURIO10', 'kurio.u_ana.checkout': '{}', other: 'x' })

    applyBootParams(db, '?reset=1', [local, tab])

    expect(local.keys()).toEqual(['kurio.mock.db'])
    expect(tab.keys()).toEqual(['other'])
  })

  it('MOCK-3#1: reset restores the mock state and clears the app storage, keeping the mock database', () => {
    const db = createDb(memoryStorage())
    db.state.sessions.push({ token: 'tok_x', userId: 'u_ana', expiresAt: 1 })
    db.state.scenario = 'slow'
    const storage = clientStorage({ 'kurio.session': '{}', 'kurio.u_ana.attempt': '{}', 'kurio.mock.db': '{}', other: 'x' })
    const before = db.state.generation

    const result = applyBootParams(db, '?reset=1&scenario=empty', [storage])

    expect(db.state.generation).toBe(before + 1)
    expect(db.state.sessions).toEqual([])
    expect(db.state.scenario).toBe('empty') // a scenario given with the reset applies after it
    expect(storage.keys().sort()).toEqual(['kurio.mock.db', 'other'])
    expect(result.search).toBe('')
  })
})
