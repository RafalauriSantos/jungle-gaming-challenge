import { defaultParseSearch } from '@tanstack/react-router'

// The router reads `?minPrice=1` as the number 1. A number cannot hold an 18-decimal ETH amount (0.123456789012345678
// becomes 0.12345678901234568, 0.0000001 prints as 1e-7), so these two keep the text exactly as it was typed.
const AMOUNT_KEYS = ['minPrice', 'maxPrice']

export function parseSearch(searchStr: string): Record<string, unknown> {
  const parsed: Record<string, unknown> = { ...defaultParseSearch(searchStr) }
  const raw = new URLSearchParams(searchStr)
  for (const key of AMOUNT_KEYS) {
    const typed = raw.get(key)
    if (typed === null) continue
    // The app writes strings as JSON ("1.5"); a person types the bare digits.
    parsed[key] = typed.startsWith('"') ? parsed[key] : typed
  }
  return parsed
}
