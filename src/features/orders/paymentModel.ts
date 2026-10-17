import type { Provider, Quote, QuoteChange, Wallet } from '@/api/types'
import type { Values } from '@/features/wallets/WalletFields'

/** What the payment screen knows and can do. The two layouts only draw it. */
export interface PaymentModel {
  quote?: Quote
  /** True once the quote on screen is the answer for the current cart, not a placeholder of the previous one. */
  settled: boolean
  /** The quote differs from the one the user accepted: the new terms must be confirmed again. */
  stale: boolean
  changes: QuoteChange[]
  acceptNewTerms: () => void
  coupon: string
  walletsLoading: boolean
  saved: Wallet[]
  selectedId?: string
  selected?: Wallet
  chooseWallet: (id: string) => void
  other: boolean
  setOther: (value: boolean) => void
  inline: Values
  setInlineField: (key: keyof Values) => (value: string) => void
  inlineErrors: Record<string, string>
  note: string
  setNote: (value: string) => void
  noteError?: string
  provider?: Provider
  chooseProvider: (provider: Provider) => void
  connection: 'idle' | 'connecting' | 'connected'
  connect: () => void
  disconnect: () => void
  connectError?: string
  problem?: string
  canReview: boolean
  review: () => void
}
