import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { shouldRetry } from './query-client'

const status = (code: number) => new AxiosError('x', undefined, undefined, undefined, { status: code } as never)

describe('retry policy', () => {
  it('retries network errors and 5xx twice', () => {
    expect(shouldRetry(0, new AxiosError('Network Error'))).toBe(true)
    expect(shouldRetry(1, status(503))).toBe(true)
    expect(shouldRetry(2, status(503))).toBe(false)
  })

  it('does not retry an answer such as 403, 404 or 422', () => {
    for (const code of [401, 403, 404, 409, 422]) expect(shouldRetry(0, status(code)), String(code)).toBe(false)
  })
})
