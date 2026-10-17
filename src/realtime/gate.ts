import type { Order } from '@/api/types'

/** Version gate: a payload replaces state only when it is newer. Equal means a duplicate; lower means old. */
export const shouldApplyVersion = (current: number | undefined, incoming: number) => current === undefined || incoming > current

type OrderState = Pick<Order, 'status' | 'version'>

/**
 * The status rule comes before the version rule. A final order accepts nothing. A pending order accepts
 * a final status whatever its version (a late refetch must not hide a confirmation), and otherwise
 * only a newer version.
 */
export function shouldApplyOrder(current: OrderState, incoming: OrderState): boolean {
  if (current.status !== 'pending') return false
  if (incoming.status !== 'pending') return true
  return shouldApplyVersion(current.version, incoming.version)
}
