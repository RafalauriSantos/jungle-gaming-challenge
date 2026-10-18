import { beforeEach, describe, expect, it } from 'vitest'
import type { Quote } from '@/api/types'
import { addItem } from './cart'
import { createQuote, getQuote, requireCurrentQuote } from './quote'
import { testContext } from './testing'

// nft-004 (Ethereum) costs 1.61, nft-007 (Ethereum) costs 3.2; both have stock on tier 1/10.
const A = { nftId: 'nft-004', editionId: 'nft-004:1-10' }
const B = { nftId: 'nft-007', editionId: 'nft-007:1-10' }
const ANA = 'u_ana'
let t: ReturnType<typeof testContext>

beforeEach(() => {
  t = testContext()
  addItem(t.db, ANA, { ...A, quantity: 2 })
  addItem(t.db, ANA, { ...B, quantity: 1 })
})

const nft = (id: string) => t.db.state.nfts.find((n) => n.id === id)!

describe('quote totals', () => {
  it('TEST-8#1: prices each line, adds the network fee and sums exactly', () => {
    const q = createQuote(t.db, ANA)
    expect(q.network).toBe('ethereum')
    expect(q.lines.map((l) => [l.tokenId, l.quantity, l.unitPrice, l.lineTotal])).toEqual([
      [nft('nft-004').tokenId, 2, '1.61', '3.22'],
      [nft('nft-007').tokenId, 1, '3.2', '3.2'],
    ])
    expect(q).toMatchObject({ subtotal: '6.42', discount: '0', networkFee: '0.016', total: '6.436', coupon: null, issues: [] })
  })

  it('applies a coupon as a percentage of the subtotal', () => {
    const q = createQuote(t.db, ANA, 'KURIO10')
    expect(q).toMatchObject({ subtotal: '6.42', discount: '0.642', total: '5.794', coupon: { code: 'KURIO10', status: 'applied' } })
    expect(createQuote(t.db, ANA, 'LANCAMENTO5')).toMatchObject({ discount: '0.321', total: '6.115' })
  })

  it('reports an invalid or expired coupon as a result, with no discount', () => {
    expect(createQuote(t.db, ANA, 'NOPE')).toMatchObject({ discount: '0', total: '6.436', coupon: { code: 'NOPE', status: 'invalid', message: expect.any(String) } })
    expect(createQuote(t.db, ANA, 'EXPIRADO')).toMatchObject({ discount: '0', coupon: { status: 'expired', message: expect.any(String) } })
  })

  it('lets the coupon scenarios force the answer for any code', () => {
    t.db.state.scenario = 'coupon-invalid'
    expect(createQuote(t.db, ANA, 'KURIO10').coupon).toMatchObject({ status: 'invalid' })
    t.db.state.scenario = 'coupon-expired'
    expect(createQuote(t.db, ANA, 'KURIO10')).toMatchObject({ discount: '0', coupon: { status: 'expired' } })
  })

  it('refuses to quote an empty cart', () => {
    expect(() => createQuote(t.db, 'u_bruno')).toThrowError(expect.objectContaining({ status: 422 }))
  })

  it('lists a line the stock can no longer cover as an issue', () => {
    nft('nft-004').editions.find((e) => e.id === A.editionId)!.available = 1
    expect(createQuote(t.db, ANA).issues).toEqual([{ type: 'unavailable', ...A, available: 1 }])
  })
})

describe('quote validity', () => {
  it('is valid until something it depends on changes', () => {
    const q = createQuote(t.db, ANA)
    expect(getQuote(t.db, ANA, q.id).status).toBe('valid')
  })

  it.each([
    ['a price', () => Object.assign(nft('nft-004'), { price: '1.7', version: 2 })],
    ['the stock of an edition', () => (nft('nft-007').editions.find((e) => e.id === B.editionId)!.available = 4)],
    ['the cart', () => addItem(t.db, ANA, { ...A, quantity: 1 })],
  ])('turns stale when %s changes, and carries the current quote', (_name, change) => {
    const q = createQuote(t.db, ANA, 'KURIO10')
    change()
    const result = getQuote(t.db, ANA, q.id)
    expect(result.status).toBe('stale')
    expect((result.current as Quote).id).not.toBe(q.id)
  })

  it('expires after five minutes', () => {
    const q = createQuote(t.db, ANA)
    t.advance(5 * 60_000 - 1)
    expect(getQuote(t.db, ANA, q.id).status).toBe('valid')
    t.advance(1)
    expect(getQuote(t.db, ANA, q.id).status).toBe('expired')
  })

  it('requireCurrentQuote returns a valid quote and refuses a stale one with the new quote and what changed', () => {
    const q = createQuote(t.db, ANA)
    expect(requireCurrentQuote(t.db, ANA, q.id).quote.id).toBe(q.id)

    Object.assign(nft('nft-004'), { price: '1.7', version: 2 })
    expect(() => requireCurrentQuote(t.db, ANA, q.id)).toThrowError(
      expect.objectContaining({
        status: 409,
        body: expect.objectContaining({
          code: 'quote_stale',
          details: expect.objectContaining({
            quote: expect.objectContaining({ subtotal: '6.6' }),
            changes: [{ type: 'price_changed', ...A, nftId: 'nft-004', was: '1.61', now: '1.7' }],
          }),
        }),
      }),
    )
  })

  it('belongs to the user who asked for it', () => {
    const q = createQuote(t.db, ANA)
    expect(() => getQuote(t.db, 'u_bruno', q.id)).toThrowError(expect.objectContaining({ status: 403 }))
    expect(() => getQuote(t.db, ANA, 'q_missing')).toThrowError(expect.objectContaining({ status: 404 }))
  })
})
