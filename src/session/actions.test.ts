import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { endSession } from './actions'
import { getSession, setSession } from './store'

// A Storage whose stored keys are its own enumerable keys, as in a browser.
function memoryStorage(initial: Record<string, string>) {
  const data: Record<string, string> = { ...initial }
  for (const [name, fn] of Object.entries({
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => void (data[k] = v),
    removeItem: (k: string) => void delete data[k],
  })) Object.defineProperty(data, name, { value: fn, enumerable: false })
  return data as typeof data & Storage
}

const auth = (id: string) => ({ user: { id, username: id, email: `${id}@kurio.test` }, session: { token: `tok_${id}`, expiresAt: '2030-01-01T00:00:00.000Z' } })
let local: ReturnType<typeof memoryStorage>
let session: ReturnType<typeof memoryStorage>
beforeEach(() => {
  local = memoryStorage({ 'kurio.u_ana.draft': 'a', 'kurio.u_bruno.draft': 'b', 'kurio.visitor.cart': 'v' })
  session = memoryStorage({ 'kurio.u_ana.checkout': 'a' })
  vi.stubGlobal('localStorage', local)
  vi.stubGlobal('sessionStorage', session)
})

describe('logout', () => {
  it('AUTH-4#1: clears the private cache and the stored data of that user, and nobody else\'s', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['u', 'u_ana', 'cart'], { items: [1] })
    queryClient.setQueryData(['nfts', 'list'], { items: [] })
    setSession(auth('u_ana'))

    endSession(queryClient, { forget: true })

    expect(getSession()).toBeNull()
    expect(queryClient.getQueryCache().getAll()).toEqual([])
    expect(Object.keys(local).sort()).toEqual(['kurio.u_bruno.draft', 'kurio.visitor.cart'])
    expect(Object.keys(session)).toEqual([])
  })

  it('AUTH-4#1: an expired session keeps the stored data so the user can pick up after signing in again', () => {
    setSession(auth('u_ana'))
    endSession(new QueryClient(), { forget: false })
    expect(Object.keys(local)).toContain('kurio.u_ana.draft')
    expect(Object.keys(session)).toContain('kurio.u_ana.checkout')
  })
})
