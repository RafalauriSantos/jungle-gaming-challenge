import { delay, http, HttpResponse } from 'msw'
import type { OrderBody } from '../services/orders'
import { db } from '../db'
import { ctx } from '../runtime'
import { addItem, getCart, mergeVisitorCart, removeItem, setQuantity } from '../services/cart'
import { createOrder, getOrder, listPendingOrders } from '../services/orders'
import { createQuote, getQuote } from '../services/quote'
import { connectWallet } from '../services/wallets'
import { addEth } from '@/lib/eth'
import { nftEvent } from '../events'
import { callerOf, respond } from './respond'

/**
 * The `price-changed` and `sold-out` scenarios: just before the order is read, something changes in the
 * catalog (a price goes up, an edition runs out), once, and the scenario ends. This is the race the
 * checkout has to survive between the review and the click.
 */
function disturbCatalog(userId: string) {
  const scenario = db.state.scenario
  if (scenario !== 'price-changed' && scenario !== 'sold-out') return
  const line = getCart(db, userId).items[0]
  const nft = line && db.state.nfts.find((n) => n.id === line.nftId)
  if (!nft) return
  if (scenario === 'price-changed') nft.price = addEth(nft.price, '0.1')
  else nft.editions.find((e) => e.id === line!.editionId)!.available = 0
  nft.version += 1
  db.state.scenario = 'success'
  db.save()
  ctx.publish(nftEvent(nft, db.now()))
}

export const commerceHandlers = [
  http.get('/api/cart', ({ request }) => respond(() => HttpResponse.json(getCart(db, callerOf(request).id)))),

  http.post('/api/cart/items', ({ request }) =>
    respond(async () => {
      const user = callerOf(request)
      await delay(100)
      return HttpResponse.json(addItem(db, user.id, (await request.json()) as Parameters<typeof addItem>[2]))
    }),
  ),

  http.put('/api/cart/items/:nftId/:editionId', ({ request, params }) =>
    respond(async () => {
      const user = callerOf(request)
      const { quantity } = (await request.json()) as { quantity: number }
      return HttpResponse.json(setQuantity(db, user.id, String(params.nftId), decodeURIComponent(String(params.editionId)), quantity))
    }),
  ),

  http.delete('/api/cart/items/:nftId/:editionId', ({ request, params }) =>
    respond(() => HttpResponse.json(removeItem(db, callerOf(request).id, String(params.nftId), decodeURIComponent(String(params.editionId))))),
  ),

  http.post('/api/cart/merge', ({ request }) =>
    respond(async () => {
      const user = callerOf(request)
      return HttpResponse.json(mergeVisitorCart(db, user.id, (await request.json()) as Parameters<typeof mergeVisitorCart>[2]))
    }),
  ),

  http.post('/api/quotes', ({ request }) =>
    respond(async () => {
      const user = callerOf(request)
      const { couponCode } = (await request.json().catch(() => ({}))) as { couponCode?: string }
      await delay(150)
      return HttpResponse.json(createQuote(db, user.id, couponCode))
    }),
  ),

  http.get('/api/quotes/:id', ({ request, params }) => respond(() => HttpResponse.json(getQuote(db, callerOf(request).id, String(params.id))))),

  http.post('/api/orders', ({ request }) =>
    respond(async () => {
      const user = callerOf(request)
      const body = (await request.json()) as OrderBody
      await delay(300)
      disturbCatalog(user.id)
      const { order, replayed } = createOrder(ctx, user.id, request.headers.get('Idempotency-Key') ?? '', body)
      // The order exists, but the answer never reaches the client. A resend with the same key will find it.
      if (db.state.scenario === 'order-timeout' && !replayed) return HttpResponse.error()
      return HttpResponse.json(order, replayed ? { status: 200, headers: { 'Idempotent-Replayed': 'true' } } : { status: 201 })
    }),
  ),

  http.post('/api/wallet-connections', ({ request }) =>
    respond(async () => {
      callerOf(request)
      const { provider } = (await request.json()) as { provider: Parameters<typeof connectWallet>[1] }
      await delay(600)
      return HttpResponse.json(connectWallet(db, provider))
    }),
  ),

  http.get('/api/orders', ({ request }) =>
    respond(() => {
      const user = callerOf(request)
      return HttpResponse.json({ items: new URL(request.url).searchParams.get('status') === 'pending' ? listPendingOrders(ctx, user.id) : [] })
    }),
  ),

  http.get('/api/orders/:id', ({ request, params }) => respond(() => HttpResponse.json(getOrder(ctx, callerOf(request).id, String(params.id))))),
]
