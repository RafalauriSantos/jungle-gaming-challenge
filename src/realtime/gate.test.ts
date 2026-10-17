import { describe, expect, it } from 'vitest'
import { shouldApplyOrder, shouldApplyVersion } from './gate'

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

  it('lets a final status reach a pending order whatever its version', () => {
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
