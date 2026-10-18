import type { OrderBody } from '@/api/orders'

interface Store {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * The idempotency key of "this press of Confirmar": the same quote, wallet, provider and note keep the same
 * key (stored before the request goes out), so a resend after a timeout or a reload asks for the same
 * order. Any change is a new attempt with a new key. One attempt is kept per user.
 */
export function attemptKey(store: Store, userId: string, body: OrderBody): string {
  const slot = `kurio.${userId}.attempt`
  // The note is in: the server compares the whole body, so a key may never meet a different note.
  const bodyHash = JSON.stringify([body.quoteId, body.wallet, body.provider, body.note ?? null])
  try {
    const saved = JSON.parse(store.getItem(slot) ?? 'null') as { key: string; bodyHash: string } | null
    if (saved?.bodyHash === bodyHash) return saved.key
  } catch {
    // An unreadable record is a new attempt.
  }
  const key = crypto.randomUUID()
  store.setItem(slot, JSON.stringify({ key, bodyHash }))
  return key
}

/** Once an order reaches a final state, the next press of Confirmar is a new attempt. */
export function clearAttempt(store: { removeItem(key: string): void }, userId: string) {
  store.removeItem(`kurio.${userId}.attempt`)
}
