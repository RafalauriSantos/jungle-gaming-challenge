import type { Quote, QuoteChange, QuoteIssue, QuoteLine } from '@/api/types'
import { addEth, mulEth, scaleEth, subEth, sumEth } from '@/lib/eth'
import type { Db, StoredQuote } from '../db'
import { COUPONS, NETWORK_FEES, QUOTE_TTL_MS } from '../fixtures/commerce'
import { fail } from '../failure'
import { getCart } from './cart'

interface Computed {
  quote: Omit<Quote, 'id' | 'createdAt' | 'expiresAt'>
  fingerprint: string
}

/** Prices the user's current cart against the current catalog. */
function compute(db: Db, userId: string, couponCode: string | null): Computed {
  const cart = getCart(db, userId)
  if (!cart.items.length || !cart.network) throw fail(422, 'validation', 'O carrinho está vazio.')

  const lines: QuoteLine[] = []
  const issues: QuoteIssue[] = []
  for (const item of cart.items) {
    const nft = db.state.nfts.find((n) => n.id === item.nftId)!
    const edition = nft.editions.find((e) => e.id === item.editionId)!
    lines.push({
      lineId: item.lineId,
      nftId: nft.id,
      editionId: edition.id,
      tokenId: nft.tokenId,
      name: nft.name,
      image: nft.image,
      tier: edition.tier,
      quantity: item.quantity,
      unitPrice: nft.price,
      lineTotal: mulEth(nft.price, item.quantity),
      nftVersion: nft.version,
      available: edition.available,
    })
    if (item.quantity > edition.available) issues.push({ type: 'unavailable', nftId: nft.id, editionId: edition.id, available: edition.available })
  }

  const subtotal = sumEth(lines.map((l) => l.lineTotal))
  const known = couponCode ? COUPONS[couponCode.trim().toUpperCase()] : undefined
  // The coupon scenarios make every code invalid or expired, for a reproducible demonstration.
  const forced = db.state.scenario === 'coupon-invalid' ? 'invalid' : db.state.scenario === 'coupon-expired' ? 'expired' : null
  const coupon: Quote['coupon'] = !couponCode
    ? null
    : forced === 'invalid' || (!known && !forced)
      ? { code: couponCode, status: 'invalid', message: 'Código promocional inválido.' }
      : forced === 'expired' || known?.expired
        ? { code: couponCode, status: 'expired', message: 'Este código promocional expirou.' }
        : { code: couponCode, status: 'applied' }
  const discount = coupon?.status === 'applied' ? scaleEth(subtotal, known!.percent, 100n) : '0'
  const networkFee = NETWORK_FEES[cart.network]
  const total = addEth(subEth(subtotal, discount), networkFee)

  const quote = { cartVersion: cart.version, network: cart.network, lines, subtotal, discount, networkFee, total, coupon, issues }
  // Every input of the totals. If any differs later, the quote is stale.
  const fingerprint = JSON.stringify([
    lines.map((l) => [l.lineId, l.nftId, l.editionId, l.quantity, l.unitPrice, l.nftVersion, l.available]),
    coupon && [coupon.code, coupon.status],
    discount,
    cart.network,
    networkFee,
    subtotal,
    total,
  ])
  return { quote, fingerprint }
}

function store(db: Db, userId: string, couponCode: string | null, c: Computed): Quote {
  const id = db.nextId('q')
  const createdAt = db.now()
  const expiresAt = createdAt + QUOTE_TTL_MS
  const quote: Quote = { ...c.quote, id, createdAt: new Date(createdAt).toISOString(), expiresAt: new Date(expiresAt).toISOString() }
  const stored: StoredQuote = { userId, cartVersion: c.quote.cartVersion, couponCode, fingerprint: c.fingerprint, createdAt, expiresAt, quote }
  db.state.quotes[id] = stored
  db.save()
  return structuredClone(quote)
}

export function createQuote(db: Db, userId: string, couponCode?: string | null): Quote {
  const code = couponCode?.trim() || null
  return store(db, userId, code, compute(db, userId, code))
}

function owned(db: Db, userId: string, id: string): StoredQuote {
  const stored = db.state.quotes[id]
  if (!stored) throw fail(404, 'not_found', 'Cotação não encontrada.')
  if (stored.userId !== userId) throw fail(403, 'forbidden', 'Esta cotação pertence a outro usuário.')
  return stored
}

/** The quote's standing now: still good, out of date, or past its time. A new quote comes with the last two. */
export function getQuote(db: Db, userId: string, id: string): { status: 'valid' | 'stale' | 'expired'; quote: Quote; current?: Quote } {
  const stored = owned(db, userId, id)
  const expired = db.now() >= stored.expiresAt
  // An emptied cart cannot be quoted again: the old quote is stale and there is nothing to replace it.
  const fresh = getCart(db, userId).items.length ? compute(db, userId, stored.couponCode) : undefined
  if (fresh && !expired && fresh.fingerprint === stored.fingerprint) return { status: 'valid', quote: structuredClone(stored.quote) }
  const status = expired ? 'expired' : 'stale'
  return { status, quote: structuredClone(stored.quote), ...(fresh && { current: store(db, userId, stored.couponCode, fresh) }) }
}

function diff(before: Quote, now: Quote): QuoteChange[] {
  const changes: QuoteChange[] = []
  const sameLines =
    before.lines.length === now.lines.length &&
    before.lines.every((l) => now.lines.some((n) => n.lineId === l.lineId && n.quantity === l.quantity))
  if (!sameLines) changes.push({ type: 'cart_changed' })
  for (const line of before.lines) {
    const current = now.lines.find((n) => n.lineId === line.lineId)
    if (!current) continue
    if (current.unitPrice !== line.unitPrice) changes.push({ type: 'price_changed', nftId: line.nftId, editionId: line.editionId, was: line.unitPrice, now: current.unitPrice })
  }
  for (const issue of now.issues) if (!before.issues.some((i) => i.editionId === issue.editionId)) changes.push(issue)
  if (before.coupon?.status !== now.coupon?.status) changes.push({ type: 'coupon_changed', was: before.coupon?.status, now: now.coupon?.status })
  if (before.networkFee !== now.networkFee) changes.push({ type: 'fee_changed', was: before.networkFee, now: now.networkFee })
  return changes
}

/** For order creation: the stored quote when it still matches, otherwise `quote_stale` with the new one. */
export function requireCurrentQuote(db: Db, userId: string, id: string): StoredQuote {
  const stored = owned(db, userId, id)
  const result = getQuote(db, userId, id)
  if (result.status === 'valid') return stored
  throw fail(409, 'quote_stale', 'O preço, o estoque ou o carrinho mudou. Confirme a nova cotação.', undefined, {
    quote: result.current,
    changes: result.current ? diff(stored.quote, result.current) : [{ type: 'cart_changed' }],
  })
}
