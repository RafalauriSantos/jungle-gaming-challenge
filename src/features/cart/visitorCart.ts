// The cart of a visitor who is not signed in, kept in this browser until the first sign-in claims it.
const KEY = 'kurio.visitor.cart'

export interface VisitorLine {
  nftId: string
  editionId: string
  quantity: number
}
interface Stored {
  id: string
  items: VisitorLine[]
  claimedBy?: string
}

export function readVisitorCart(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    return null
  }
}

function write(cart: Stored | null) {
  try {
    if (cart) localStorage.setItem(KEY, JSON.stringify(cart))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage may be unavailable; the visitor simply keeps nothing.
  }
}

export function addVisitorItem(line: VisitorLine) {
  const cart = readVisitorCart() ?? { id: `vc_${crypto.randomUUID()}`, items: [] }
  const existing = cart.items.find((i) => i.editionId === line.editionId && i.nftId === line.nftId)
  if (existing) existing.quantity += line.quantity
  else cart.items.push({ ...line })
  write(cart)
}

/**
 * The first user to sign in claims the cart; only that user may retry its merge.
 * Returns what to send to the server, or null when there is nothing for this user.
 */
export function claimVisitorCart(userId: string): { mergeId: string; items: VisitorLine[] } | null {
  const cart = readVisitorCart()
  if (!cart || cart.items.length === 0) return null
  if (cart.claimedBy && cart.claimedBy !== userId) return null
  if (!cart.claimedBy) write({ ...cart, claimedBy: userId })
  return { mergeId: cart.id, items: cart.items }
}

export const finishVisitorMerge = () => write(null)
