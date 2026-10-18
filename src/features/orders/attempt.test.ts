import { describe, expect, it } from 'vitest'
import { attemptKey } from './attempt'

const storage = () => {
  const map = new Map<string, string>()
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), removeItem: (k: string) => void map.delete(k) }
}
const body = { quoteId: 'q_1', wallet: { walletId: 'w1' }, provider: 'metamask' as const }

describe('attempt key', () => {
  it('ORD-7#1 CHK-5#3: the same attempt keeps its key across calls, reloads and resends', () => {
    const s = storage()
    const first = attemptKey(s, 'u_ana', body)
    expect(attemptKey(s, 'u_ana', { ...body })).toBe(first)
    expect(attemptKey(s, 'u_ana', body)).toBe(first)
  })

  it('a different quote, wallet or provider is a new attempt with a new key', () => {
    const s = storage()
    const first = attemptKey(s, 'u_ana', body)
    expect(attemptKey(s, 'u_ana', { ...body, quoteId: 'q_2' })).not.toBe(first)
    const second = attemptKey(s, 'u_ana', { ...body, provider: 'coinbase' })
    expect(second).not.toBe(first)
    expect(attemptKey(s, 'u_ana', { ...body, provider: 'coinbase' })).toBe(second)
  })

  it('ORD-7#1: the note is part of the attempt: the server hashes it, so a changed note must not reuse the key', () => {
    const s = storage()
    const first = attemptKey(s, 'u_ana', { ...body, note: 'Presente' })
    expect(attemptKey(s, 'u_ana', { ...body, note: 'Presente' })).toBe(first)
    expect(attemptKey(s, 'u_ana', { ...body, note: 'Outro texto' })).not.toBe(first)
    expect(attemptKey(s, 'u_ana', body)).not.toBe(first)
  })

  it('keeps one attempt per user', () => {
    const s = storage()
    expect(attemptKey(s, 'u_ana', body)).not.toBe(attemptKey(s, 'u_bruno', body))
  })
})
