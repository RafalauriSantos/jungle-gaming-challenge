// The shape of every error the API answers with. The source of truth is ARCHITECTURE.md §2.

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
