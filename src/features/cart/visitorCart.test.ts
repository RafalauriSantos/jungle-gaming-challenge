import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addVisitorItem, claimVisitorCart, finishVisitorMerge, readVisitorCart } from './visitorCart'

const line = { nftId: 'nft-004', editionId: 'nft-004-1-10', quantity: 1 }
beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) })
  vi.stubGlobal('crypto', { randomUUID: () => 'fixed-id' })
})

describe('visitor cart', () => {
  it('CART-3#1: keeps what a visitor adds, adding quantities of the same edition', () => {
    addVisitorItem(line)
    addVisitorItem({ ...line, quantity: 2 })
    addVisitorItem({ ...line, editionId: 'nft-004-1-50' })
    expect(readVisitorCart()!.items).toEqual([{ ...line, quantity: 3 }, { ...line, editionId: 'nft-004-1-50' }])
  })

  it('CART-3#1: the first user to sign in claims it with a stable merge id', () => {
    addVisitorItem(line)
    const first = claimVisitorCart('u_ana')!
    expect(claimVisitorCart('u_ana')!.mergeId).toBe(first.mergeId)
    expect(first.items).toEqual([line])
  })

  it('CART-3#3: another user who signs in gets nothing from a claimed cart', () => {
    addVisitorItem(line)
    claimVisitorCart('u_ana')
    expect(claimVisitorCart('u_bruno')).toBeNull()
  })

  it('CART-3#2: after a successful merge the visitor cart is gone', () => {
    addVisitorItem(line)
    claimVisitorCart('u_ana')
    finishVisitorMerge()
    expect(readVisitorCart()).toBeNull()
    expect(claimVisitorCart('u_ana')).toBeNull()
  })
})
