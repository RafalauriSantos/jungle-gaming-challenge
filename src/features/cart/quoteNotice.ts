import { useEffect, useRef, useState } from 'react'
import type { Quote } from '@/api/types'
import { announce } from '@/lib/announce'
import { formatEth } from '@/lib/eth'

/** What changed under the user's feet between two quotes of the same cart: a price, or less stock. */
export function describeChanges(before: Quote, now: Quote): string[] {
  const out: string[] = []
  for (const line of now.lines) {
    const old = before.lines.find((l) => l.lineId === line.lineId)
    if (!old) continue // new lines come from the user's own actions
    if (old.unitPrice !== line.unitPrice) out.push(`O preço de ${line.name} mudou de ${formatEth(old.unitPrice)} para ${formatEth(line.unitPrice)}.`)
    if (line.available < old.available) out.push(`O estoque de ${line.name} diminuiu: restam ${line.available}.`)
  }
  return out
}

/**
 * A message for the changes that arrive while the cart is open (by event or by refetch), shown and
 * announced. Changes the user makes themselves (another cart version) are not news.
 */
export function useQuoteNotice(quote: Quote | undefined): string | null {
  const previous = useRef<Quote>(undefined)
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (!quote) return
    const before = previous.current
    previous.current = quote
    if (!before || before.cartVersion !== quote.cartVersion) return
    const changes = describeChanges(before, quote)
    if (!changes.length) return
    const text = changes.join(' ')
    setNotice(text)
    announce(text)
  }, [quote])
  return notice
}
