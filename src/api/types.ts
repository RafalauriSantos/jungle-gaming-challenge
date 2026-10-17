// Contracts shared by the mock backend, the Axios layer and the UI. The source of truth is ARCHITECTURE.md §2.

export const COLLECTIONS = [
  'digital-art',
  'photography',
  'music',
  'art-3d',
  'collectibles',
  'generative',
  'games',
  'memberships',
  'utility',
] as const
export type Collection = (typeof COLLECTIONS)[number]

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]

export const SORTS = ['recent', 'price-asc', 'price-desc', 'name'] as const
export type Sort = (typeof SORTS)[number]

export const FEEDS = ['all', 'new', 'trending'] as const
export type Feed = (typeof FEEDS)[number]

export const PROVIDERS = ['metamask', 'walletconnect', 'coinbase'] as const
export type Provider = (typeof PROVIDERS)[number]

/** Amounts of ETH are decimal strings, see `src/lib/eth.ts`. */
export type Eth = string

// --- errors

export type ErrorCode =
  | 'unauthenticated'
  | 'session_expired'
  | 'forbidden'
  | 'not_found'
  | 'email_taken'
  | 'username_taken'
  | 'availability_conflict'
  | 'network_mismatch'
  | 'quote_stale'
  | 'order_pending'
  | 'idempotency_conflict'
  | 'wallet_refused'
  | 'validation'
  | 'wallet_network_mismatch'
  | 'transient'

export interface ErrorBody {
  code: ErrorCode
  message: string
  /** Field name to message, for `validation` and conflicts tied to a field. */
  fields?: Record<string, string>
  details?: unknown
}

// --- catalog

export const EDITION_TIERS = ['1/1', '1/10', '1/50'] as const
export type EditionTier = (typeof EDITION_TIERS)[number]

export interface Edition {
  /** `<nftId>:<tier with "-" for "/">`, safe in a URL path. */
  id: string
  tier: EditionTier
  supply: number
  available: number
  status: 'open' | 'sold_out'
}

export interface Nft {
  id: string
  /** The NFT's number, as in "Emerald Ape #042". */
  number: number
  /** `#` plus the number padded to 4 digits. One per NFT. */
  tokenId: string
  name: string
  creator: string
  collection: Collection
  network: Network
  price: Eth
  previousPrice?: Eth
  image: string
  rare: boolean
  listedAt: string
  popularity: number
  editions: Edition[]
  /** Monotonic; bumped on every change, used by the version gate. */
  version: number
}

export interface NftListParams {
  q?: string
  collection?: Collection[]
  network?: Network[]
  minPrice?: Eth
  maxPrice?: Eth
  feed?: Feed
  sort?: Sort
  page?: number
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface NftListResponse extends Page<Nft> {
  facets: { collection: Record<Collection, number>; network: Record<Network, number> }
  priceRange: { min: Eth; max: Eth }
}

// --- session and account

export interface User {
  id: string
  username: string
  email: string
}

export interface Session {
  token: string
  expiresAt: string
}

export interface AuthResponse {
  user: User
  session: Session
}

export interface SignupInput {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginInput {
  email: string
  password: string
}

// --- wallets and profile

export interface WalletInput {
  displayName: string
  nickname: string
  network: Network
  profileName: string
  address: string
  ensOrSecondary?: string
  walletType: Provider
  referralCode: string
  email: string
  /** Required on Ethereum only. */
  ensName?: string
}

export interface Wallet extends WalletInput {
  id: string
  version: number
}

export interface Wallets {
  primary: Wallet | null
  secondary: Wallet | null
}

export type ProfileInput = Partial<Pick<Profile, 'displayName' | 'username' | 'email'>>

export interface PasswordInput {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export interface Profile {
  displayName: string
  username: string
  email: string
  ensName?: string
  walletNickname?: string
  avatarUrl: string | null
  version: number
}

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
