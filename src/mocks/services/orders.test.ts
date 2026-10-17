import { beforeEach, describe, expect, it } from 'vitest'
import type { AppEvent, OrderUpdated } from '@/api/events'
import type { Order, WalletInput } from '@/api/types'
import { createDb } from '../db'
import { NETWORK_FEES } from '../fixtures/commerce'
import { addItem, getCart, removeItem, setQuantity } from './cart'
import type { Ctx } from './context'
import { createOrder, getOrder, listPendingOrders, settleDue } from './orders'
import { createQuote } from './quote'
import { testContext } from './testing'

// Ana: nft-004 and nft-007 are on Ethereum; her principal wallet is Ethereum, her secondary one Polygon.
const A = { nftId: 'nft-004', editionId: 'nft-004:1-10' }
const B = { nftId: 'nft-007', editionId: 'nft-007:1-10' }
const ANA = 'u_ana'
const PRINCIPAL = { walletId: 'wal_seed_ana_1' }
let t: ReturnType<typeof testContext>

beforeEach(() => {
  t = testContext()
  addItem(t.db, ANA, { ...A, quantity: 2 })
  addItem(t.db, ANA, { ...B, quantity: 1 })
})

const nft = (id: string) => t.db.state.nfts.find((n) => n.id === id)!
const stock = (nftId: string, editionId: string) => nft(nftId).editions.find((e) => e.id === editionId)!.available
const place = (key = 'key-1', over: Partial<{ wallet: object; provider: string; note: string }> = {}, couponCode?: string) => {
  const quote = createQuote(t.db, ANA, couponCode)
  return createOrder(t.ctx, ANA, key, { quoteId: quote.id, wallet: PRINCIPAL, provider: 'metamask', ...over } as never)
}
const lineIds = () => Object.fromEntries(getCart(t.db, ANA).items.map((i) => [i.editionId, i.lineId]))

describe('creating an order', () => {
  it('MON-3#1: makes a pending order whose total is its quote, reserves the stock and announces it', () => {
    const { order, replayed } = place()
    expect(replayed).toBe(false)
    expect(order).toMatchObject({ id: 'ord_000001', status: 'pending', version: 1, provider: 'metamask' })
    expect(order.wallet).toMatchObject({ label: 'Principal', network: 'ethereum' })
    expect(order.quote.total).toBe('6.436')
    expect(order).not.toHaveProperty('userId')
    expect(stock('nft-004', A.editionId)).toBe(7) // 9 - 2
    expect(stock('nft-007', B.editionId)).toBe(6) // 7 - 1
    expect(t.events.map((e) => e.type)).toEqual(['nft.updated', 'nft.updated', 'order.updated'])
    expect(t.events.at(-1)).toMatchObject({ eventId: 'order.ord_000001.v1', version: 1, scope: { userId: ANA }, data: { id: 'ord_000001', status: 'pending' } })
  })

  it('ORD-7#1: the same key returns the same order, created once', () => {
    const first = place('key-1')
    const second = createOrder(t.ctx, ANA, 'key-1', { quoteId: first.order.quote.id, wallet: PRINCIPAL, provider: 'metamask' })
    expect(second.replayed).toBe(true)
    expect(second.order.id).toBe(first.order.id)
    expect(t.db.state.orders).toHaveLength(1)
    expect(stock('nft-004', A.editionId)).toBe(7) // reserved once
  })

  it('ORD-8#1: the same key with different content is a conflict', () => {
    const first = place('key-1')
    expect(() => createOrder(t.ctx, ANA, 'key-1', { quoteId: first.order.quote.id, wallet: PRINCIPAL, provider: 'coinbase' })).toThrowError(
      expect.objectContaining({ status: 409, body: expect.objectContaining({ code: 'idempotency_conflict' }) }),
    )
  })

  it('CHK-1#1: keeps the optional collector note with the order', () => {
    expect(place('key-note', { note: 'Entregar na carteira principal.' }).order.note).toBe('Entregar na carteira principal.')
  })

  it('CHK-1#1: an order without a note carries no note', () => {
    expect(place('key-none').order.note).toBeUndefined()
  })

  it('CHK-1#1: refuses a note longer than 280 characters on its own field', () => {
    expect(() => place('key-long', { note: 'x'.repeat(281) })).toThrowError(expect.objectContaining({ status: 422, body: expect.objectContaining({ fields: { note: expect.any(String) } }) }))
  })

  it('ORD-8#1: the same key with another note is a conflict', () => {
    const first = place('key-note', { note: 'um' })
    expect(() => createOrder(t.ctx, ANA, 'key-note', { quoteId: first.order.quote.id, wallet: PRINCIPAL, provider: 'metamask', note: 'dois' })).toThrowError(expect.objectContaining({ status: 409 }))
  })

  it('needs an idempotency key', () => {
    const quote = createQuote(t.db, ANA)
    expect(() => createOrder(t.ctx, ANA, '', { quoteId: quote.id, wallet: PRINCIPAL, provider: 'metamask' })).toThrowError(expect.objectContaining({ status: 422 }))
  })

  it('refuses a second order while one is pending, naming it', () => {
    place('key-1')
    expect(() => place('key-2')).toThrowError(
      expect.objectContaining({ status: 409, body: expect.objectContaining({ code: 'order_pending', details: { orderId: 'ord_000001' } }) }),
    )
  })

  it('creates nothing from a stale quote and says what changed', () => {
    const quote = createQuote(t.db, ANA)
    Object.assign(nft('nft-004'), { price: '1.7', version: 2 })
    expect(() => createOrder(t.ctx, ANA, 'key-1', { quoteId: quote.id, wallet: PRINCIPAL, provider: 'metamask' })).toThrowError(
      expect.objectContaining({ status: 409, body: expect.objectContaining({ code: 'quote_stale' }) }),
    )
    expect(t.db.state.orders).toHaveLength(0)
    expect(stock('nft-004', A.editionId)).toBe(9)
  })

  const CHANGES: [string, () => unknown][] = [
    ['a price', () => Object.assign(nft('nft-004'), { price: '1.7', version: 2 })],
    ['the stock', () => (nft('nft-004').editions.find((e) => e.id === A.editionId)!.available = 5)],
    ['the coupon status', () => (t.db.state.scenario = 'coupon-expired')],
    ['the network fee', () => Object.assign(NETWORK_FEES, { ethereum: '0.02' })],
    ['the cart network', () => (t.db.state.carts[ANA]!.network = 'polygon')],
    ['the cart lines', () => addItem(t.db, ANA, { ...A, quantity: 1 })],
  ]
  for (const [name, change] of CHANGES) {
    it(`CHK-3#1: a change of ${name} between the review and the click creates nothing`, () => {
      const quote = createQuote(t.db, ANA, 'KURIO10')
      try {
        change()
        expect(() => createOrder(t.ctx, ANA, 'key-1', { quoteId: quote.id, wallet: PRINCIPAL, provider: 'metamask' })).toThrowError(
          expect.objectContaining({ status: 409, body: expect.objectContaining({ code: 'quote_stale' }) }),
        )
        expect(t.db.state.orders).toHaveLength(0)
      } finally {
        NETWORK_FEES.ethereum = '0.016'
      }
    })
  }

  it('refuses a quote that already lists stock issues', () => {
    nft('nft-004').editions.find((e) => e.id === A.editionId)!.available = 1
    expect(() => place()).toThrowError(expect.objectContaining({ status: 409, body: expect.objectContaining({ code: 'availability_conflict' }) }))
    expect(t.db.state.orders).toHaveLength(0)
  })

  it('needs a wallet on the same network as the quote', () => {
    expect(() => place('key-1', { wallet: { walletId: 'wal_seed_ana_2' } })).toThrowError(
      expect.objectContaining({ status: 422, body: expect.objectContaining({ code: 'wallet_network_mismatch' }) }),
    )
  })

  it("refuses another user's wallet, and validates an inline one", () => {
    addItem(t.db, 'u_bruno', { ...A, quantity: 1 })
    const quote = createQuote(t.db, 'u_bruno')
    expect(() => createOrder(t.ctx, 'u_bruno', 'k', { quoteId: quote.id, wallet: PRINCIPAL, provider: 'metamask' })).toThrowError(
      expect.objectContaining({ status: 422, body: expect.objectContaining({ fields: { wallet: expect.any(String) } }) }),
    )
    const bad = { displayName: '', nickname: 'x', network: 'ethereum' } as WalletInput
    expect(() => createOrder(t.ctx, 'u_bruno', 'k', { quoteId: quote.id, wallet: { inline: bad }, provider: 'metamask' })).toThrowError(
      expect.objectContaining({ status: 422, body: expect.objectContaining({ fields: expect.objectContaining({ 'wallet.displayName': expect.any(String) }) }) }),
    )
    const ok: WalletInput = { displayName: 'Bruno Lima', nickname: 'Avulsa', network: 'ethereum', profileName: 'bruno', address: '0x' + 'cd34'.repeat(10), walletType: 'metamask', referralCode: 'KURIO2026', email: 'bruno@kurio.test', ensName: 'bruno' }
    expect(createOrder(t.ctx, 'u_bruno', 'k', { quoteId: quote.id, wallet: { inline: ok }, provider: 'metamask' }).order.wallet.label).toBe('Avulsa')
  })
})

describe('settling an order', () => {
  it('ORD-1#1: a pending order is confirmed at its due time, once, with a receipt', () => {
    place()
    t.events.length = 0
    t.advance(1999)
    expect(getOrder(t.ctx, ANA, 'ord_000001').status).toBe('pending')
    t.advance(1)
    const order = getOrder(t.ctx, ANA, 'ord_000001')
    expect(order).toMatchObject({ status: 'confirmed', version: 2 })
    expect(order.receipt).toMatchObject({ txRef: expect.stringMatching(/^0x[0-9a-f]{64}$/), explorerUrl: expect.stringContaining(order.receipt!.txRef) })
    expect(t.events.map((e) => e.eventId)).toEqual(['order.ord_000001.v2'])

    // Terminal: reading or settling again changes nothing.
    settleDue(t.ctx)
    expect(getOrder(t.ctx, ANA, 'ord_000001')).toEqual(order)
    expect(t.events).toHaveLength(1)
  })

  it('ORD-4#1: a refused order frees the stock and leaves the cart, and a line removed meanwhile is not restored', () => {
    t.db.state.scenario = 'payment-refused'
    place()
    removeItem(t.db, ANA, B.nftId, B.editionId)
    const cartWhilePending = getCart(t.db, ANA)
    t.advance(2000)
    const order = getOrder(t.ctx, ANA, 'ord_000001')
    expect(order).toMatchObject({ status: 'refused', version: 2, refusalReason: 'payment_refused' })
    expect(order.receipt).toBeUndefined()
    expect(stock('nft-004', A.editionId)).toBe(9)
    expect(stock('nft-007', B.editionId)).toBe(7)
    expect(getCart(t.db, ANA)).toEqual(cartWhilePending)
    expect(t.events.at(-1)).toMatchObject({ type: 'order.updated', data: { status: 'refused', refusalReason: 'payment_refused' } })
  })

  it('confirming takes the purchased quantities out of the cart', () => {
    place()
    t.advance(2000)
    expect(getCart(t.db, ANA)).toMatchObject({ items: [], network: null })
  })

  it('ORD-4#2: lines added after the order stay in the cart', () => {
    place()
    addItem(t.db, ANA, { nftId: 'nft-004', editionId: 'nft-004:1-50', quantity: 3 })
    t.advance(2000)
    expect(getCart(t.db, ANA).items).toEqual([expect.objectContaining({ editionId: 'nft-004:1-50', quantity: 3 })])
  })

  it('ORD-4#3: a line removed and added again while pending keeps its quantity', () => {
    place()
    removeItem(t.db, ANA, A.nftId, A.editionId)
    addItem(t.db, ANA, { ...A, quantity: 1 })
    const again = lineIds()[A.editionId]
    t.advance(2000)
    expect(getCart(t.db, ANA).items).toEqual([{ lineId: again, ...A, quantity: 1 }])
  })

  it('ORD-4#4: a line raised while pending loses only the purchased part', () => {
    place()
    setQuantity(t.db, ANA, B.nftId, B.editionId, 4) // bought 1, now 4
    t.advance(2000)
    expect(getCart(t.db, ANA).items).toEqual([expect.objectContaining({ ...B, quantity: 3 })])
  })

  it('ORD-5#1: the receipt keeps the values of the order after the catalog changes', () => {
    place()
    t.advance(2000)
    const before = getOrder(t.ctx, ANA, 'ord_000001')
    Object.assign(nft('nft-004'), { price: '9.99', version: 9 })
    expect(getOrder(t.ctx, ANA, 'ord_000001').quote).toEqual(before.quote)
    expect(getOrder(t.ctx, ANA, 'ord_000001').quote.total).toBe('6.436')
  })

  it('MOCK-12#1 MOCK-12#2: a reload or a silent socket changes nothing; the order settles when read', () => {
    place()
    // No timer runs and no socket exists: only the clock moves, and the state is reloaded from storage.
    t.db.advance(2500)
    const events: AppEvent[] = []
    const db = createDb(t.storage) // as after a page reload
    const ctx: Ctx = { db, publish: (e) => void events.push(e), schedule: () => {} }
    expect(db.state.orders[0]!.status).toBe('pending')
    expect(getOrder(ctx, ANA, 'ord_000001').status).toBe('confirmed')
    expect(events.map((e) => e.eventId)).toEqual(['order.ord_000001.v2'])
  })

  it('MOCK-11#1: two runs give the same order ids and transaction refs', () => {
    const run = () => {
      const x = testContext()
      addItem(x.db, ANA, { ...A, quantity: 1 })
      const quote = createQuote(x.db, ANA)
      const id = createOrder(x.ctx, ANA, 'k', { quoteId: quote.id, wallet: PRINCIPAL, provider: 'metamask' }).order.id
      x.advance(2000)
      return [id, getOrder(x.ctx, ANA, id).receipt!.txRef]
    }
    expect(run()).toEqual(run())
  })
})

describe('reading orders', () => {
  it('lets only the owner read an order', () => {
    place()
    expect(() => getOrder(t.ctx, 'u_bruno', 'ord_000001')).toThrowError(expect.objectContaining({ status: 403 }))
    expect(() => getOrder(t.ctx, ANA, 'ord_999')).toThrowError(expect.objectContaining({ status: 404 }))
  })

  it('lists the pending order, then none once it settles', () => {
    place()
    expect(listPendingOrders(t.ctx, ANA).map((o: Order) => o.id)).toEqual(['ord_000001'])
    expect(listPendingOrders(t.ctx, 'u_bruno')).toEqual([])
    t.advance(2000)
    expect(listPendingOrders(t.ctx, ANA)).toEqual([])
  })

  it('announces events of a user only to that user', () => {
    place()
    const orderEvents = t.events.filter((e): e is OrderUpdated => e.type === 'order.updated')
    expect(orderEvents.every((e) => typeof e.scope === 'object' && e.scope.userId === ANA)).toBe(true)
  })
})
