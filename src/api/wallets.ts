import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import type { Wallet, WalletInput, Wallets } from './types'

/** Every private query key starts with the user id, so one user's cache never answers for another. */
export const walletKeys = { all: (userId: string) => ['u', userId, 'wallets'] as const }

export const walletsOptions = (userId: string) =>
  queryOptions({
    queryKey: walletKeys.all(userId),
    queryFn: ({ signal }) => api.get<Wallets>('/wallets', { signal }).then((r) => r.data),
  })

export const saveWalletRequest = (slot: keyof Wallets, input: WalletInput) =>
  api.put<Wallet>(`/wallets/${slot}`, input).then((r) => r.data)
