import { describe, expect, it } from 'vitest'
import { addItem, getCart, mergeVisitorCart, removeItem, setQuantity } from './cart'
import { testContext } from './testing'

// Fixtures: nft-004 is on Ethereum (1/10 stock 9, 1/50 stock 21); nft-003 is on Polygon (1/10 stock 6).
const ETH_10 = { nftId: 'nft-004', editionId: 'nft-004:1-10' }
const ETH_50 = { nftId: 'nft-004', editionId: 'nft-004:1-50' }
const POLY_10 = { nftId: 'nft-003', editionId: 'nft-003:1-10' }
const ANA = 'u_ana'

describe('cart', () => {
  it('CART-1#1: adding creates a line, adding again grows it, and the cart gets a version and a network', () => {
    const { ctx } = testContext()
    expect(getCart(ctx.db, ANA)).toEqual({ version: 0, network: null, items: [] })
    const first = addItem(ctx.db, ANA, { ...ETH_10, quantity: 2 })
    expect(first.network).toBe('ethereum')
    expect(first.items).toEqual([{ lineId: 'line_000001', ...ETH_10, quantity: 2 }])
    const second = addItem(ctx.db, ANA, { ...ETH_10, quantity: 1 })
    expect(second.items).toEqual([{ lineId: 'line_000001', ...ETH_10, quantity: 3 }])
    expect(second.version).toBeGreaterThan(first.version)
  })

  it('CART-1#2: setting changes the quantity of a line', () => {
    const { ctx } = testContext()
    addItem(ctx.db, ANA, { ...ETH_10, quantity: 2 })
    expect(setQuantity(ctx.db, ANA, ETH_10.nftId, ETH_10.editionId, 5).items[0]!.quantity).toBe(5)
  })

  it('CART-1#3: removing deletes the line, and an empty cart has no network', () => {
    const { ctx } = testContext()
    addItem(ctx.db, ANA, { ...ETH_10, quantity: 1 })
    addItem(ctx.db, ANA, { ...ETH_50, quantity: 1 })
    expect(removeItem(ctx.db, ANA, ETH_10.nftId, ETH_10.editionId).items.map((i) => i.editionId)).toEqual([ETH_50.editionId])
    const empty = removeItem(ctx.db, ANA, ETH_50.nftId, ETH_50.editionId)
    expect(empty).toMatchObject({ items: [], network: null })
  })

  it('CART-1#4: above stock is refused with the available count and the cart is unchanged', () => {
    const { ctx } = testContext()
    addItem(ctx.db, ANA, { ...ETH_10, quantity: 8 })
    const before = structuredClone(getCart(ctx.db, ANA))
    expect(() => addItem(ctx.db, ANA, { ...ETH_10, quantity: 2 })).toThrowError(
      expect.objectContaining({ status: 409, body: expect.objectContaining({ code: 'availability_conflict', details: { available: 9 } }) }),
    )
    expect(() => setQuantity(ctx.db, ANA, ETH_10.nftId, ETH_10.editionId, 10)).toThrowError(expect.objectContaining({ status: 409 }))
    expect(getCart(ctx.db, ANA)).toEqual(before)
  })

  it('keeps one network per cart', () => {
    const { ctx } = testContext()
    addItem(ctx.db, ANA, { ...ETH_10, quantity: 1 })
    expect(() => addItem(ctx.db, ANA, { ...POLY_10, quantity: 1 })).toThrowError(
      expect.objectContaining({ status: 409, body: expect.objectContaining({ code: 'network_mismatch', details: { cartNetwork: 'ethereum' } }) }),
    )
    expect(getCart(ctx.db, ANA).items).toHaveLength(1)
  })

  it('MON-2#1: accepts only whole quantities of at least one', () => {
    const { ctx } = testContext()
    for (const quantity of [0, -1, 1.5, Number.NaN]) {
      expect(() => addItem(ctx.db, ANA, { ...ETH_10, quantity }), String(quantity)).toThrowError(
        expect.objectContaining({ status: 422, body: expect.objectContaining({ fields: { quantity: expect.any(String) } }) }),
      )
    }
  })

  it('answers not found for an unknown NFT, edition or line', () => {
    const { ctx } = testContext()
    expect(() => addItem(ctx.db, ANA, { nftId: 'nft-999', editionId: 'x', quantity: 1 })).toThrowError(expect.objectContaining({ status: 404 }))
    expect(() => addItem(ctx.db, ANA, { nftId: 'nft-004', editionId: 'nft-004:9-9', quantity: 1 })).toThrowError(expect.objectContaining({ status: 404 }))
    expect(() => setQuantity(ctx.db, ANA, ETH_10.nftId, ETH_10.editionId, 1)).toThrowError(expect.objectContaining({ status: 404 }))
  })

  it('gives a removed and re-added line a new id', () => {
    const { ctx } = testContext()
    const first = addItem(ctx.db, ANA, { ...ETH_10, quantity: 1 }).items[0]!.lineId
    removeItem(ctx.db, ANA, ETH_10.nftId, ETH_10.editionId)
    const again = addItem(ctx.db, ANA, { ...ETH_10, quantity: 1 }).items[0]!.lineId
    expect(again).not.toBe(first)
  })

  it('does not share a cart between users', () => {
    const { ctx } = testContext()
    addItem(ctx.db, ANA, { ...ETH_10, quantity: 1 })
    expect(getCart(ctx.db, 'u_bruno').items).toEqual([])
  })
})

describe('visitor cart merge', () => {
  const visitor = [
    { ...ETH_10, quantity: 2 },
    { ...POLY_10, quantity: 1 },
    { ...ETH_50, quantity: 99 },
  ]

  it('CART-3#4: adds the visitor items, caps them by stock, and lists what it skipped', () => {
    const { ctx } = testContext()
    addItem(ctx.db, ANA, { ...ETH_10, quantity: 1 })
    const { cart, skipped } = mergeVisitorCart(ctx.db, ANA, { mergeId: 'm1', items: visitor })
    expect(cart.items.find((i) => i.editionId === ETH_10.editionId)!.quantity).toBe(3)
    expect(cart.items.find((i) => i.editionId === ETH_50.editionId)!.quantity).toBe(21) // capped by stock
    expect(skipped).toEqual([
      { ...POLY_10, requested: 1, applied: 0, reason: 'network_mismatch' },
      { ...ETH_50, requested: 99, applied: 21, reason: 'unavailable' },
    ])
  })

  it('CART-3#2: does nothing when the same merge is replayed', () => {
    const { ctx } = testContext()
    const first = mergeVisitorCart(ctx.db, ANA, { mergeId: 'm1', items: visitor })
    const again = mergeVisitorCart(ctx.db, ANA, { mergeId: 'm1', items: visitor })
    expect(again.cart).toEqual(first.cart)
    expect(again.skipped).toEqual([])
  })

  it('CART-3#3: gives nothing to another user who presents a merge that was already claimed', () => {
    const { ctx } = testContext()
    mergeVisitorCart(ctx.db, ANA, { mergeId: 'm1', items: visitor })
    const other = mergeVisitorCart(ctx.db, 'u_bruno', { mergeId: 'm1', items: visitor })
    expect(other.cart.items).toEqual([])
    expect(getCart(ctx.db, 'u_bruno').items).toEqual([])
  })
})
