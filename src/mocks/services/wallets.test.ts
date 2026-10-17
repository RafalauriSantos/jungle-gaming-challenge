import { beforeEach, describe, expect, it } from 'vitest'
import type { WalletInput } from '@/api/types'
import { createDb, memoryStorage, type Db } from '../db'
import { getWallets, saveWallet } from './wallets'

const evm = '0x' + 'ab12'.repeat(10)
const valid: WalletInput = {
  displayName: 'Bruno Lima',
  nickname: 'Principal',
  network: 'ethereum',
  profileName: 'bruno.kurio',
  address: evm,
  walletType: 'metamask',
  referralCode: 'KURIO2026',
  email: 'bruno@kurio.test',
  ensName: 'bruno',
}
let db: Db
beforeEach(() => {
  db = createDb(memoryStorage())
})

describe('wallets', () => {
  it('returns the seeded wallets of one user and none for another', () => {
    expect(getWallets(db, 'u_ana').primary?.nickname).toBe('Principal')
    expect(getWallets(db, 'u_ana').secondary?.nickname).toBe('Reserva')
    expect(getWallets(db, 'u_bruno')).toEqual({ primary: null, secondary: null })
  })

  it('creates then updates a slot, bumping its version', () => {
    const first = saveWallet(db, 'u_bruno', 'primary', valid)
    expect(first).toMatchObject({ id: 'wal_000001', version: 1, nickname: 'Principal' })
    const second = saveWallet(db, 'u_bruno', 'primary', { ...valid, nickname: 'Cofre' })
    expect(second).toMatchObject({ id: first.id, version: 2, nickname: 'Cofre' })
    expect(getWallets(db, 'u_bruno').secondary).toBeNull()
  })

  it('does not touch another user', () => {
    saveWallet(db, 'u_bruno', 'primary', valid)
    expect(getWallets(db, 'u_ana').primary?.address).not.toBe(evm)
  })

  it('validates required fields and formats', () => {
    const run = () => saveWallet(db, 'u_bruno', 'primary', { ...valid, displayName: '', address: '0x123', referralCode: 'ab', email: 'x' })
    expect(run).toThrowError(
      expect.objectContaining({
        status: 422,
        body: expect.objectContaining({
          code: 'validation',
          fields: expect.objectContaining({ displayName: expect.any(String), address: expect.any(String), referralCode: expect.any(String), email: expect.any(String) }),
        }),
      }),
    )
  })

  it('requires the ENS name on Ethereum only', () => {
    expect(() => saveWallet(db, 'u_bruno', 'primary', { ...valid, ensName: undefined })).toThrowError(
      expect.objectContaining({ body: expect.objectContaining({ fields: { ensName: expect.any(String) } }) }),
    )
    const polygon = saveWallet(db, 'u_bruno', 'secondary', { ...valid, network: 'polygon', ensName: undefined })
    expect(polygon.network).toBe('polygon')
  })

  it('checks the address format of the chosen network', () => {
    const solana = '4Nd1mYQzvgnZQ3dSPrtJXJvKNWJHgTWBvPhC1FDR6Y2d'
    expect(saveWallet(db, 'u_bruno', 'primary', { ...valid, network: 'solana', address: solana, ensName: undefined }).address).toBe(solana)
    expect(() => saveWallet(db, 'u_bruno', 'primary', { ...valid, network: 'ethereum', address: solana })).toThrow()
  })
})
