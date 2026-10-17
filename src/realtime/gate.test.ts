import { describe, expect, it } from 'vitest'
import { pickNewerNft, pickOrderRead, shouldApplyOrder, shouldApplyVersion } from './gate'

describe('version gate', () => {
  it('applies only what is newer than what it has', () => {
    expect(shouldApplyVersion(undefined, 1)).toBe(true)
    expect(shouldApplyVersion(3, 4)).toBe(true)
    expect(shouldApplyVersion(3, 3)).toBe(false) // a duplicate
    expect(shouldApplyVersion(3, 2)).toBe(false) // an old event
  })
})

describe('order gate', () => {
  const pending = (version: number) => ({ status: 'pending' as const, version })

  it('moves a pending order forward by version', () => {
    expect(shouldApplyOrder(pending(1), pending(2))).toBe(true)
    expect(shouldApplyOrder(pending(2), pending(2))).toBe(false)
    expect(shouldApplyOrder(pending(2), pending(1))).toBe(false)
  })

  it('ORD-10#2: lets a final status reach a pending order whatever its version', () => {
    expect(shouldApplyOrder(pending(5), { status: 'confirmed', version: 2 })).toBe(true)
    expect(shouldApplyOrder(pending(1), { status: 'refused', version: 2 })).toBe(true)
  })

  it('ORD-1#2: never changes an order that is already confirmed or refused', () => {
    for (const final of ['confirmed', 'refused'] as const) {
      const current = { status: final, version: 2 }
      expect(shouldApplyOrder(current, pending(9))).toBe(false)
      expect(shouldApplyOrder(current, { status: 'confirmed', version: 9 })).toBe(false)
      expect(shouldApplyOrder(current, { status: 'refused', version: 9 })).toBe(false)
    }
  })
})

describe('reading with REST', () => {
  const order = (status: 'pending' | 'confirmed' | 'refused', version: number, extra = {}) => ({ status, version, ...extra })

  it('RT-4#3: keeps a newer cached item over an older read, and takes an equal or newer one', () => {
    expect(pickNewerNft({ version: 3 }, { version: 2 })).toEqual({ version: 3 })
    expect(pickNewerNft({ version: 3 }, { version: 3 })).toEqual({ version: 3 })
    expect(pickNewerNft({ version: 2 }, { version: 3 })).toEqual({ version: 3 })
    expect(pickNewerNft(undefined, { version: 1 })).toEqual({ version: 1 })
  })

  it('ORD-10#4: a read never moves a final order to another status, but may enrich it with the receipt', () => {
    expect(pickOrderRead(order('confirmed', 2), order('pending', 5))).toEqual(order('confirmed', 2))
    expect(pickOrderRead(order('confirmed', 2), order('refused', 9))).toEqual(order('confirmed', 2))
    expect(pickOrderRead(order('confirmed', 2), order('confirmed', 2, { receipt: 'r' }))).toEqual(order('confirmed', 2, { receipt: 'r' }))
  })

  it('ORD-10#4: a pending order takes a final read whatever its version, and a pending read only if not older', () => {
    expect(pickOrderRead(order('pending', 3), order('confirmed', 1))).toEqual(order('confirmed', 1))
    expect(pickOrderRead(order('pending', 3), order('pending', 2))).toEqual(order('pending', 3))
    expect(pickOrderRead(order('pending', 3), order('pending', 3))).toEqual(order('pending', 3))
  })
})
