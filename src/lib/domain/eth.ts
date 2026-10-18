// ETH amounts are decimal strings. All math runs on integers (wei), never on floats.
const DECIMALS = 18
const UNIT = 10n ** BigInt(DECIMALS)
const HUNDREDTH = UNIT / 100n
const AMOUNT = /^\d+(\.\d{1,18})?$/

/** Decimal ETH string to wei. Throws on anything but digits with up to 18 decimals. */
export function parseEth(value: string): bigint {
  if (!AMOUNT.test(value)) throw new RangeError(`Invalid ETH amount: "${value}"`)
  const [whole, frac = ''] = value.split('.')
  return BigInt(whole + frac.padEnd(DECIMALS, '0'))
}

/** Wei to the shortest decimal ETH string. */
export function weiToEth(wei: bigint): string {
  if (wei < 0n) throw new RangeError('ETH amounts cannot be negative')
  const s = wei.toString().padStart(DECIMALS + 1, '0')
  const frac = s.slice(-DECIMALS).replace(/0+$/, '')
  return frac ? `${s.slice(0, -DECIMALS)}.${frac}` : s.slice(0, -DECIMALS)
}

export const addEth = (a: string, b: string) => weiToEth(parseEth(a) + parseEth(b))
export const sumEth = (values: string[]) => weiToEth(values.reduce((sum, v) => sum + parseEth(v), 0n))

export function subEth(a: string, b: string): string {
  const diff = parseEth(a) - parseEth(b)
  if (diff < 0n) throw new RangeError(`${a} - ${b} is negative`)
  return weiToEth(diff)
}

export function mulEth(value: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0) throw new RangeError(`Quantity must be a whole number, got ${quantity}`)
  return weiToEth(parseEth(value) * BigInt(quantity))
}

/** value * numerator / denominator, rounded down. */
export const scaleEth = (value: string, numerator: bigint, denominator: bigint) =>
  weiToEth((parseEth(value) * numerator) / denominator)

export function compareEth(a: string, b: string): -1 | 0 | 1 {
  const [x, y] = [parseEth(a), parseEth(b)]
  return x < y ? -1 : x > y ? 1 : 0
}

/** Display form: at least two decimals, as many more as the value has, never rounded. */
export function formatEth(value: string): string {
  const [whole, frac = ''] = weiToEth(parseEth(value)).split('.')
  return `${whole}.${frac.padEnd(2, '0')} ETH`
}

/** Whole hundredths of an ETH (rounded down), for range controls that need small integers. */
export const ethToCenti = (value: string) => Number(parseEth(value) / HUNDREDTH)

export function centiToEth(centi: number): string {
  if (!Number.isSafeInteger(centi) || centi < 0) throw new RangeError(`Invalid hundredths: ${centi}`)
  return weiToEth(BigInt(centi) * HUNDREDTH)
}
