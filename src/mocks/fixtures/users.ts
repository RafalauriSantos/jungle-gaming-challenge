import type { Profile, Wallets } from '@/api/types'

// Fictional credentials, documented in the README:
//   ana@kurio.test    / Colecionar#2026   (two wallets, like the Figma payment frame)
//   bruno@kurio.test  / Colecionar#2027   (no wallets)
// Only salted hashes are stored.
export const SEED_USERS = [
  { id: 'u_ana', username: 'ana', email: 'ana@kurio.test', salt: 's-ana-7f3a', passwordHash: '7f1503c56c52144aac90b439272639206b1da4f6db5b06219159094333c21f29' },
  { id: 'u_bruno', username: 'bruno', email: 'bruno@kurio.test', salt: 's-bruno-91c2', passwordHash: '4f6a08042084b1f26bf1589ceb1b4c795983e754e4257f3a825be92f09b7b1a2' },
]

export const SEED_PROFILES: Record<string, Profile> = {
  u_ana: { displayName: 'Ana Souza', username: 'ana', email: 'ana@kurio.test', ensName: 'ana', walletNickname: 'Principal', avatarUrl: null, version: 1 },
  u_bruno: { displayName: 'Bruno Lima', username: 'bruno', email: 'bruno@kurio.test', avatarUrl: null, version: 1 },
}

export const SEED_WALLETS: Record<string, Wallets> = {
  u_ana: {
    primary: {
      id: 'wal_seed_ana_1', version: 1, displayName: 'Ana Souza', nickname: 'Principal', network: 'ethereum', profileName: 'ana.kurio',
      address: '0xA91F00000000000000000000000000000000E82C', walletType: 'metamask', referralCode: 'KURIO2026', email: 'ana@kurio.test', ensName: 'ana',
    },
    secondary: {
      id: 'wal_seed_ana_2', version: 1, displayName: 'Ana Souza', nickname: 'Reserva', network: 'polygon', profileName: 'nova.kurio',
      address: '0x5B1E00000000000000000000000000000000C0DE', ensOrSecondary: 'nova.kurio.eth', walletType: 'walletconnect', referralCode: 'KURIO2026', email: 'ana@kurio.test',
    },
  },
  u_bruno: { primary: null, secondary: null },
}
