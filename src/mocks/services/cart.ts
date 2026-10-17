import type { Cart, Edition, Nft, SkippedLine } from '@/api/types'
import type { Db } from '../db'
import { fail } from '../failure'

const emptyCart = (): Cart => ({ version: 0, network: null, items: [] })
const cartOf = (db: Db, userId: string) => (db.state.carts[userId] ??= emptyCart())

export const getCart = (db: Db, userId: string): Cart => structuredClone(db.state.carts[userId] ?? emptyCart())

function find(db: Db, nftId: string, editionId: string): { nft: Nft; edition: Edition } {
  const nft = db.state.nfts.find((n) => n.id === nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  if (!nft || !edition) throw fail(404, 'not_found', 'NFT ou edição não encontrada.')
  return { nft, edition }
}

function checkQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw fail(422, 'validation', 'Quantidade inválida.', { quantity: 'Informe um número inteiro a partir de 1.' })
  }
}

const overStock = (available: number) =>
  fail(409, 'availability_conflict', 'Quantidade acima do estoque disponível.', { quantity: `Restam ${available}.` }, { available })

export function addItem(db: Db, userId: string, input: { nftId: string; editionId: string; quantity: number }): Cart {
  checkQuantity(input.quantity)
  const { nft, edition } = find(db, input.nftId, input.editionId)
  const cart = cartOf(db, userId)
  if (cart.network && cart.network !== nft.network) {
    throw fail(409, 'network_mismatch', 'O carrinho tem NFTs de outra rede.', undefined, { cartNetwork: cart.network })
  }
  const line = cart.items.find((i) => i.editionId === input.editionId)
  const wanted = (line?.quantity ?? 0) + input.quantity
  if (wanted > edition.available) throw overStock(edition.available)
  if (line) line.quantity = wanted
  else cart.items.push({ lineId: db.nextId('line'), nftId: input.nftId, editionId: input.editionId, quantity: input.quantity })
  cart.network = nft.network
  cart.version += 1
  db.save()
  return structuredClone(cart)
}

export function setQuantity(db: Db, userId: string, nftId: string, editionId: string, quantity: number): Cart {
  checkQuantity(quantity)
  const { edition } = find(db, nftId, editionId)
  const cart = cartOf(db, userId)
  const line = cart.items.find((i) => i.editionId === editionId)
  if (!line) throw fail(404, 'not_found', 'Item não está no carrinho.')
  if (quantity > edition.available) throw overStock(edition.available)
  line.quantity = quantity
  cart.version += 1
  db.save()
  return structuredClone(cart)
}

export function removeItem(db: Db, userId: string, nftId: string, editionId: string): Cart {
  const cart = cartOf(db, userId)
  if (!cart.items.some((i) => i.editionId === editionId && i.nftId === nftId)) throw fail(404, 'not_found', 'Item não está no carrinho.')
  cart.items = cart.items.filter((i) => i.editionId !== editionId)
  if (!cart.items.length) cart.network = null
  cart.version += 1
  db.save()
  return structuredClone(cart)
}

/**
 * Takes a visitor cart into the user's cart, once. The first user to present a `mergeId` claims it;
 * anyone presenting it again, including another user, gets their own cart back unchanged.
 */
export function mergeVisitorCart(
  db: Db,
  userId: string,
  input: { mergeId: string; items: { nftId: string; editionId: string; quantity: number }[] },
): { cart: Cart; skipped: SkippedLine[] } {
  if (db.state.merges[input.mergeId]) return { cart: getCart(db, userId), skipped: [] }
  db.state.merges[input.mergeId] = userId

  const cart = cartOf(db, userId)
  const skipped: SkippedLine[] = []
  let changed = false
  for (const item of input.items) {
    const found = db.state.nfts.find((n) => n.id === item.nftId)
    const edition = found?.editions.find((e) => e.id === item.editionId)
    if (!found || !edition || !Number.isInteger(item.quantity) || item.quantity < 1) continue
    const base = { nftId: item.nftId, editionId: item.editionId, requested: item.quantity }
    if (cart.network && cart.network !== found.network) {
      skipped.push({ ...base, applied: 0, reason: 'network_mismatch' })
      continue
    }
    const line = cart.items.find((i) => i.editionId === item.editionId)
    const room = Math.max(0, edition.available - (line?.quantity ?? 0))
    const applied = Math.min(item.quantity, room)
    if (applied < item.quantity) skipped.push({ ...base, applied, reason: 'unavailable' })
    if (applied === 0) continue
    if (line) line.quantity += applied
    else cart.items.push({ lineId: db.nextId('line'), nftId: item.nftId, editionId: item.editionId, quantity: applied })
    cart.network = found.network
    changed = true
  }
  if (changed) cart.version += 1
  db.save()
  return { cart: structuredClone(cart), skipped }
}
