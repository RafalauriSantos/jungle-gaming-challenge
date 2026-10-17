import { useQuery, type QueryClient } from '@tanstack/react-query'
import { cartKeys, mergeCartRequest } from '@/api/cart'
import type { SkippedLine } from '@/api/types'
import { useUser } from '@/session/store'
import { claimVisitorCart, finishVisitorMerge } from './visitorCart'

const skippedKey = (userId: string) => ['u', userId, 'merge-skipped'] as const

/** Sends the visitor cart this user claimed. A failure keeps it claimed, so the next sign-in retries. */
export async function claimVisitorMerge(queryClient: QueryClient, userId: string) {
  const claim = claimVisitorCart(userId)
  if (!claim) return
  try {
    const { cart, skipped } = await mergeCartRequest(claim)
    finishVisitorMerge()
    queryClient.setQueryData(cartKeys.cart(userId), cart)
    queryClient.setQueryData(skippedKey(userId), skipped)
  } catch {
    // Nothing is lost: the visitor cart stays in this browser.
  }
}

/** The lines the last merge could not take (fully), for the cart page to list. */
export function useMergeSkipped(): SkippedLine[] {
  const user = useUser()
  const { data } = useQuery<SkippedLine[]>({ queryKey: skippedKey(user?.id ?? ''), queryFn: () => [], enabled: false, initialData: undefined })
  return data ?? []
}
