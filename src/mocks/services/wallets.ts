import { NETWORKS, PROVIDERS, type Wallet, type WalletInput, type Wallets } from '@/api/types'
import type { Db } from '../db'
import { fail } from '../failure'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ADDRESS = { ethereum: /^0x[0-9a-fA-F]{40}$/, polygon: /^0x[0-9a-fA-F]{40}$/, solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ }
const REQUIRED = 'Campo obrigatório.'

export const getWallets = (db: Db, userId: string): Wallets =>
  structuredClone(db.state.wallets[userId] ?? { primary: null, secondary: null })

function validate(input: WalletInput) {
  const f: Record<string, string> = {}
  for (const key of ['displayName', 'nickname', 'profileName'] as const) if (!input[key]?.trim()) f[key] = REQUIRED
  if (!NETWORKS.includes(input.network)) f.network = 'Selecione uma rede.'
  if (!PROVIDERS.includes(input.walletType)) f.walletType = 'Selecione uma carteira.'
  if (!input.address?.trim()) f.address = REQUIRED
  else if (NETWORKS.includes(input.network) && !ADDRESS[input.network].test(input.address)) f.address = 'Endereço inválido para esta rede.'
  if (!/^[A-Za-z0-9]{4,12}$/.test(input.referralCode ?? '')) f.referralCode = 'Use de 4 a 12 letras ou números.'
  if (!EMAIL.test(input.email ?? '')) f.email = 'Informe um e-mail válido.'
  if (input.network === 'ethereum' && !input.ensName?.trim()) f.ensName = REQUIRED
  return f
}

/** Creates or updates one slot of the user's wallets. */
export function saveWallet(db: Db, userId: string, slot: keyof Wallets, input: WalletInput): Wallet {
  const fields = validate(input)
  if (Object.keys(fields).length) throw fail(422, 'validation', 'Revise os campos destacados.', fields)

  const wallets = (db.state.wallets[userId] ??= { primary: null, secondary: null })
  const existing = wallets[slot]
  const wallet: Wallet = { ...input, id: existing?.id ?? db.nextId('wal'), version: (existing?.version ?? 0) + 1 }
  wallets[slot] = wallet
  db.save()
  return structuredClone(wallet)
}
