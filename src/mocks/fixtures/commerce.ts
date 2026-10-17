import type { Eth, Network } from '@/api/types'

/** One fixed fee per order, by network. Ethereum's comes from the Figma; the others are invented. */
export const NETWORK_FEES: Record<Network, Eth> = { ethereum: '0.016', polygon: '0.002', solana: '0.0005' }

/** Coupon codes the mock knows. Anything else is invalid. `expired` ones are known but out of date. */
export const COUPONS: Record<string, { percent: bigint; expired?: boolean }> = {
  KURIO10: { percent: 10n },
  LANCAMENTO5: { percent: 5n },
  EXPIRADO: { percent: 15n, expired: true },
}

export const QUOTE_TTL_MS = 5 * 60_000
export const SETTLE_AFTER_MS = 2000
