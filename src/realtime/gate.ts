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

/**
 * A REST answer was read at some moment; an event may have landed since. The answer replaces what the cache
 * holds only if it is not older. Equal versions are allowed: a read may carry more than the event did.
 */
export const pickNewerNft = <T extends { version: number }>(current: T | undefined, read: T): T => (current && read.version < current.version ? current : read)

/** Same idea for an order: a final order stays as it is, but a read of the same final status may add the receipt. */
export function pickOrderRead<T extends OrderState>(current: T | undefined, read: T): T {
  if (!current) return read
  if (current.status !== 'pending') return read.status === current.status ? read : current
  return read.status !== 'pending' || read.version >= current.version ? read : current
}
