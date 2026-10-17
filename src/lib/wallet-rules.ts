import { NETWORKS, PROVIDERS, type WalletInput } from '@/api/types'

// One definition of what a valid wallet is, used by the form (for quick feedback) and by the mock
// backend (which has the last word). Messages are shown to the user.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ADDRESS = { ethereum: /^0x[0-9a-fA-F]{40}$/, polygon: /^0x[0-9a-fA-F]{40}$/, solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ }
export const REQUIRED = 'Campo obrigatório.'

export function validateWallet(input: Partial<WalletInput>): Record<string, string> {
  const f: Record<string, string> = {}
  for (const key of ['displayName', 'nickname', 'profileName'] as const) if (!input[key]?.trim()) f[key] = REQUIRED
  const network = NETWORKS.find((n) => n === input.network)
  if (!network) f.network = 'Selecione uma rede.'
  if (!PROVIDERS.some((p) => p === input.walletType)) f.walletType = 'Selecione uma carteira.'
  if (!input.address?.trim()) f.address = REQUIRED
  else if (network && !ADDRESS[network].test(input.address)) f.address = 'Endereço inválido para esta rede.'
  if (!/^[A-Za-z0-9]{4,12}$/.test(input.referralCode ?? '')) f.referralCode = 'Use de 4 a 12 letras ou números.'
  if (!EMAIL.test(input.email ?? '')) f.email = 'Informe um e-mail válido.'
  if (network === 'ethereum' && !input.ensName?.trim()) f.ensName = REQUIRED
  return f
}
