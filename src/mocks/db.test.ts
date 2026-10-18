import { describe, expect, it } from 'vitest'
import { createDb, memoryStorage } from './db'

describe('mock database', () => {
  it('MOCK-5#1 MOCK-5#2: starts from the known scenario: varied fixtures, two users, generation 1', () => {
    const db = createDb(memoryStorage())
    expect(db.state.generation).toBe(1)
    expect(db.state.nfts).toHaveLength(57) // 48 generated + the 9 of the Figma first page
    expect(db.state.users.map((u) => u.email)).toEqual(['ana@kurio.test', 'bruno@kurio.test'])
    expect(db.state.scenario).toBe('success')
    expect(new Set(db.state.nfts.map((n) => n.collection)).size).toBe(9)
    expect(new Set(db.state.nfts.map((n) => n.network)).size).toBe(3)
  })

  it('MOCK-5#2: a state saved with an older catalog gets the current catalog and keeps the rest', () => {
    const storage = memoryStorage()
    const first = createDb(storage)
    first.state.nfts = first.state.nfts.slice(0, 48) // what browsers saved before the catalog grew
    first.state.sessions.push({ token: 'tok_keep', userId: 'u_ana', expiresAt: 1 })
    delete (first.state as { catalogVersion?: number }).catalogVersion
    first.save()

    const reopened = createDb(storage)

    expect(reopened.state.nfts).toHaveLength(57)
    expect(reopened.state.sessions.map((s) => s.token)).toEqual(['tok_keep'])
  })

  it('hands out the same ids in the same order on every run', () => {
    const a = createDb(memoryStorage())
    const b = createDb(memoryStorage())
    expect([a.nextId('ord'), a.nextId('ord'), a.nextId('tok')]).toEqual(['ord_000001', 'ord_000002', 'tok_000001'])
    expect([b.nextId('ord'), b.nextId('ord'), b.nextId('tok')]).toEqual(['ord_000001', 'ord_000002', 'tok_000001'])
  })

  it('persists across a reload of the same storage', () => {
    const storage = memoryStorage()
    const first = createDb(storage)
    first.nextId('ord')
    first.state.nfts[0]!.version = 9
    first.save()
    const second = createDb(storage)
    expect(second.state.nfts[0]!.version).toBe(9)
    expect(second.nextId('ord')).toBe('ord_000002')
  })

  it('moves a controllable clock', () => {
    const db = createDb(memoryStorage())
    db.freezeClock('2026-10-01T12:00:00.000Z')
    expect(new Date(db.now()).toISOString()).toBe('2026-10-01T12:00:00.000Z')
    db.advance(60_000)
    expect(new Date(db.now()).toISOString()).toBe('2026-10-01T12:01:00.000Z')
  })

  it('reset restores the known scenario and invalidates older generations', () => {
    const db = createDb(memoryStorage())
    const before = db.state.generation
    db.nextId('ord')
    db.state.nfts[0]!.version = 5
    db.state.sessions.push({ token: 'tok_x', userId: 'u_ana', expiresAt: 1 })
    db.state.carts['u_ana'] = { version: 1, network: 'ethereum', items: [] }
    db.state.scenario = 'slow'
    db.freezeClock('2026-10-01T12:00:00.000Z')

    db.reset()

    expect(db.state.generation).toBe(before + 1)
    expect(db.isCurrent(before)).toBe(false)
    expect(db.isCurrent(before + 1)).toBe(true)
    expect(db.state.nfts[0]!.version).toBe(1)
    expect(db.state.sessions).toEqual([])
    expect(db.state.carts).toEqual({})
    expect(db.state.scenario).toBe('success')
    expect(db.state.clock.fixedAt).toBeNull()
    expect(db.nextId('ord')).toBe('ord_000001')
  })
})
