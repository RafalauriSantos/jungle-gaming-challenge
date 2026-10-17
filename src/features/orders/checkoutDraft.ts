import type { Provider } from '@/api/types'
import type { Values } from '@/features/wallets/WalletFields'

export interface CheckoutDraft {
  walletId?: string
  other: boolean
  inline: Values
  provider?: Provider
  note?: string
}

const slot = (userId: string) => `kurio.${userId}.checkout`

/**
 * What the user chose on the payment screen, kept for this tab and this user. An expired session or a
 * reload does not make them pick again; a logout wipes it with the rest of their data.
 */
export function loadDraft(userId: string): CheckoutDraft | null {
  try {
    return JSON.parse(sessionStorage.getItem(slot(userId)) ?? 'null') as CheckoutDraft | null
  } catch {
    return null
  }
}

export function saveDraft(userId: string, draft: CheckoutDraft) {
  try {
    sessionStorage.setItem(slot(userId), JSON.stringify(draft))
  } catch {
    // Storage may be unavailable; the choice still works for this render.
  }
}

export function clearDraft(userId: string) {
  try {
    sessionStorage.removeItem(slot(userId))
  } catch {
    // Nothing to clear.
  }
}
