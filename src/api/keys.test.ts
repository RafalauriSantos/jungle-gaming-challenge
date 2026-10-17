import { describe, expect, it } from 'vitest'
import { cartKeys } from './cart'
import { orderKeys } from './orders'
import { walletKeys } from './wallets'

describe('API-8#1: private query keys start with the user id', () => {
  it('API-8#1: never share a key between two users', () => {
    const keys = (id: string) => [cartKeys.cart(id), cartKeys.quote(id, 3, 'KURIO10'), orderKeys.one(id, 'ord_1'), orderKeys.pending(id), walletKeys.all(id)]
    for (const key of keys('u_ana')) expect(key.slice(0, 2)).toEqual(['u', 'u_ana'])
    keys('u_ana').forEach((key, i) => expect(key).not.toEqual(keys('u_bruno')[i]))
  })
})
