import { PROVIDERS, type Order, type Provider, type Wallet, type WalletInput, type WalletRef } from '@/api/types'
import { validateWallet } from '@/lib/wallet-rules'
import type { StoredOrder } from '../db'
import { nftEvent, orderEvent } from '../events'
import { fail } from '../failure'
import type { Ctx } from './context'
import { requireCurrentQuote } from './quote'
import { getWallets } from './wallets'

export interface OrderBody {
  quoteId: string
  wallet: WalletRef
  provider: Provider
}

const publicOrder = ({ userId: _u, dueAt: _d, outcome: _o, lines: _l, ...order }: StoredOrder): Order => structuredClone(order)

const short = (address: string) => (address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address)

/** A transaction reference that depends only on the order id, so runs and reloads agree. */
function txRefFor(orderId: string): string {
  const fnv = (text: string) => {
    let h = 0x811c9dc5
    for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0
    return h.toString(16).padStart(8, '0')
  }
  return '0x' + [1, 2, 3, 4, 5, 6, 7, 8].map((i) => fnv(`${orderId}:${i}`)).join('')
}

function resolveWallet(ctx: Ctx, userId: string, ref: WalletRef): Pick<Wallet, 'nickname' | 'displayName' | 'address' | 'network'> {
  if ('walletId' in ref) {
    const { primary, secondary } = getWallets(ctx.db, userId)
    const found = [primary, secondary].find((w) => w?.id === ref.walletId)
    if (!found) throw fail(422, 'validation', 'Carteira não encontrada.', { wallet: 'Selecione uma das suas carteiras.' })
    return found
  }
  const errors = validateWallet(ref.inline as Partial<WalletInput>)
  if (Object.keys(errors).length) {
    throw fail(422, 'validation', 'Revise os dados da carteira.', Object.fromEntries(Object.entries(errors).map(([k, v]) => [`wallet.${k}`, v])))
  }
  return ref.inline
}

export function createOrder(ctx: Ctx, userId: string, key: string, body: OrderBody): { order: Order; replayed: boolean } {
  const { db } = ctx
  if (!key.trim()) throw fail(422, 'validation', 'Falta a chave de idempotência.', { idempotencyKey: 'Obrigatória.' })

  // The same attempt, again: give back the same order (or refuse a changed body). Nothing else runs.
  const bodyHash = JSON.stringify([body.quoteId, body.wallet, body.provider])
  const known = db.state.idempotency[`${userId}:${key}`]
  if (known) {
    if (known.bodyHash !== bodyHash) throw fail(409, 'idempotency_conflict', 'Esta chave já foi usada com outro conteúdo.')
    settleDue(ctx)
    return { order: publicOrder(db.state.orders.find((o) => o.id === known.orderId)!), replayed: true }
  }

  settleDue(ctx)
  if (!PROVIDERS.includes(body.provider)) throw fail(422, 'validation', 'Selecione uma carteira.', { provider: 'Selecione uma carteira.' })
  const wallet = resolveWallet(ctx, userId, body.wallet)

  const pending = db.state.orders.find((o) => o.userId === userId && o.status === 'pending')
  if (pending) throw fail(409, 'order_pending', 'Você já tem um pedido em andamento.', undefined, { orderId: pending.id })

  const stored = requireCurrentQuote(db, userId, body.quoteId)
  if (stored.quote.issues.length) {
    throw fail(409, 'availability_conflict', 'Algum item não tem mais estoque suficiente.', undefined, { issues: stored.quote.issues })
  }
  if (wallet.network !== stored.quote.network) {
    throw fail(422, 'wallet_network_mismatch', 'A carteira escolhida não está na rede do carrinho.', { wallet: 'Escolha uma carteira da mesma rede.' })
  }

  // Reserve the stock, so nobody else buys what this order is about to take.
  const touched = new Map<string, number>()
  for (const line of stored.quote.lines) {
    const nft = db.state.nfts.find((n) => n.id === line.nftId)!
    const edition = nft.editions.find((e) => e.id === line.editionId)!
    edition.available -= line.quantity
    edition.status = edition.available > 0 ? 'open' : 'sold_out'
    touched.set(nft.id, 1)
  }
  for (const id of touched.keys()) {
    const nft = db.state.nfts.find((n) => n.id === id)!
    nft.version += 1
    ctx.publish(nftEvent(nft, db.now()))
  }

  const now = db.now()
  const order: StoredOrder = {
    id: db.nextId('ord'),
    userId,
    status: 'pending',
    version: 1,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    quote: structuredClone(stored.quote),
    wallet: { label: wallet.nickname || wallet.displayName, address: short(wallet.address), network: wallet.network },
    provider: body.provider,
    dueAt: now + db.state.settleAfterMs,
    outcome: db.state.scenario === 'payment-refused' ? 'refused' : 'confirmed',
    lines: stored.quote.lines.map(({ lineId, nftId, editionId, quantity }) => ({ lineId, nftId, editionId, quantity })),
  }
  db.state.orders.push(order)
  db.state.idempotency[`${userId}:${key}`] = { userId, bodyHash, orderId: order.id }
  db.save()
  ctx.publish(orderEvent(order, now))
  ctx.schedule(db.state.settleAfterMs, () => settleDue(ctx))
  return { order: publicOrder(order), replayed: false }
}

/** Applies every transition whose time has come. Safe to call at any moment, any number of times. */
export function settleDue(ctx: Ctx) {
  const { db } = ctx
  const now = db.now()
  for (const order of db.state.orders) {
    if (order.status !== 'pending' || order.dueAt > now) continue // terminal orders never change
    order.version += 1
    order.updatedAt = new Date(now).toISOString()

    if (order.outcome === 'confirmed') {
      order.status = 'confirmed'
      const txRef = txRefFor(order.id)
      order.receipt = { txRef, confirmedAt: order.updatedAt, explorerUrl: `https://etherscan.io/tx/${txRef}` }
      settleCart(ctx, order)
    } else {
      order.status = 'refused'
      order.refusalReason = 'payment_refused'
      releaseStock(ctx, order)
    }
    db.save()
    ctx.publish(orderEvent(order, now))
  }
}

/** Takes the purchased quantities out of the lines they were bought from. Other lines are not touched. */
function settleCart(ctx: Ctx, order: StoredOrder) {
  const cart = ctx.db.state.carts[order.userId]
  if (!cart) return
  for (const bought of order.lines) {
    const line = cart.items.find((i) => i.lineId === bought.lineId)
    if (line) line.quantity -= bought.quantity
  }
  cart.items = cart.items.filter((i) => i.quantity > 0)
  if (!cart.items.length) cart.network = null
  cart.version += 1
}

function releaseStock(ctx: Ctx, order: StoredOrder) {
  const touched = new Set<string>()
  for (const line of order.lines) {
    const nft = ctx.db.state.nfts.find((n) => n.id === line.nftId)!
    const edition = nft.editions.find((e) => e.id === line.editionId)!
    edition.available += line.quantity
    edition.status = 'open'
    touched.add(nft.id)
  }
  for (const id of touched) {
    const nft = ctx.db.state.nfts.find((n) => n.id === id)!
    nft.version += 1
    ctx.publish(nftEvent(nft, ctx.db.now()))
  }
}

export function getOrder(ctx: Ctx, userId: string, id: string): Order {
  settleDue(ctx)
  const order = ctx.db.state.orders.find((o) => o.id === id)
  if (!order) throw fail(404, 'not_found', 'Pedido não encontrado.')
  if (order.userId !== userId) throw fail(403, 'forbidden', 'Este pedido pertence a outro usuário.')
  return publicOrder(order)
}

export function listPendingOrders(ctx: Ctx, userId: string): Order[] {
  settleDue(ctx)
  return ctx.db.state.orders.filter((o) => o.userId === userId && o.status === 'pending').map(publicOrder)
}
