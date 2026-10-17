import type { Quote, QuoteLine } from '@/api/types'

/** What the cart screen knows and can do. The two layouts only draw it. */
export interface CartModel {
  quote?: Quote
  /** The quote is being read again (a new cart version or coupon). */
  updating: boolean
  loading: boolean
  loadFailed: boolean
  retryQuote: () => void
  coupon: string
  applyCoupon: (code: string) => void
  removeCoupon: () => void
  notice?: string
  error?: string
  busy: boolean
  setQuantity: (line: QuoteLine, quantity: number) => void
  remove: (line: QuoteLine) => void
}
