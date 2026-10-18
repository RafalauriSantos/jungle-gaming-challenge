import type { Provider, Wallet, WalletInput, Wallets } from '@/api/types'
import { validateWallet } from '@/lib/domain/wallet-rules'
import type { Db } from '../db'
import { fail } from '../failure'

export const getWallets = (db: Db, userId: string): Wallets =>
  structuredClone(db.state.wallets[userId] ?? { primary: null, secondary: null })

/** Creates or updates one slot of the user's wallets. */
export function saveWallet(db: Db, userId: string, slot: keyof Wallets, input: WalletInput): Wallet {
  const fields = validateWallet(input)
  if (Object.keys(fields).length) throw fail(422, 'validation', 'Revise os campos destacados.', fields)

  const wallets = (db.state.wallets[userId] ??= { primary: null, secondary: null })
  const existing = wallets[slot]
  const wallet: Wallet = { ...input, id: existing?.id ?? db.nextId('wal'), version: (existing?.version ?? 0) + 1 }
  wallets[slot] = wallet
  db.save()
  return structuredClone(wallet)
}

/** Simulates the wallet app answering a connection request. The `wallet-refused` scenario makes it say no. */
export function connectWallet(db: Db, provider: Provider): { provider: Provider; status: 'connected' } {
  if (db.state.scenario === 'wallet-refused') throw fail(422, 'wallet_refused', 'A conexão foi recusada na carteira. Tente novamente.')
  return { provider, status: 'connected' }
}
