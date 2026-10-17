import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

/**
 * Retry policy (ARCHITECTURE.md §6): up to two retries with backoff for network errors and 5xx; none for
 * 4xx, which are answers (not found, forbidden, validation), not transient failures.
 */
export const shouldRetry = (count: number, error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : undefined
  const transient = status === undefined || status >= 500 || status === 408 || status === 429
  return transient && count < 2
}

export const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: shouldRetry, refetchOnWindowFocus: false } } })
