// The cart, the quote and the order. The source of truth is ARCHITECTURE.md §2.

import type { Eth, Network, Provider } from './common'
import type { EditionTier } from './catalog'
import type { WalletInput } from './account'

// --- cart, quote, order

export interface CartItem {
  /** New for every line that is created, including one removed and added again. */
  lineId: string
  nftId: string
  editionId: string
  quantity: number
}

export interface Cart {
  version: number
  network: Network | null
  items: CartItem[]
}

export interface QuoteLine {
  lineId: string
  nftId: string
  editionId: string
  tokenId: string
  name: string
  image: string
  tier: EditionTier
  quantity: number
  unitPrice: Eth
  lineTotal: Eth
  nftVersion: number
  available: number
}

export interface QuoteIssue {
  type: 'unavailable' | 'price_changed'
  nftId: string
  editionId: string
  available?: number
  was?: Eth
  now?: Eth
}

export interface Quote {
  id: string
  cartVersion: number
  network: Network
  lines: QuoteLine[]
  subtotal: Eth
  discount: Eth
  networkFee: Eth
  total: Eth
  coupon: null | { code: string; status: 'applied' | 'invalid' | 'expired'; message?: string }
  issues: QuoteIssue[]
  createdAt: string
  expiresAt: string
}

export type WalletRef = { walletId: string } | { inline: WalletInput }

export interface Receipt {
  txRef: string
  confirmedAt: string
  explorerUrl: string
}

export interface Order {
  id: string
  status: 'pending' | 'confirmed' | 'refused'
  version: number
  createdAt: string
  updatedAt: string
  /** Immutable snapshot taken at creation. */
  quote: Quote
  wallet: { label: string; address: string; network: Network }
  provider: Provider
  note?: string
  refusalReason?: 'payment_refused' | 'insufficient_funds' | 'stock_lost'
  receipt?: Receipt
}

/** A visitor-cart line the merge could not (fully) take. */
export interface SkippedLine {
  nftId: string
  editionId: string
  requested: number
  applied: number
  reason: 'network_mismatch' | 'unavailable'
}

/** What differs between a stale quote and the current one; sent with `quote_stale`. */
export interface QuoteChange {
  type: 'price_changed' | 'unavailable' | 'cart_changed' | 'coupon_changed' | 'fee_changed'
  nftId?: string
  editionId?: string
  was?: string
  now?: string
  available?: number
}
