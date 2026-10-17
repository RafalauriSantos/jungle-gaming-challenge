import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { saveWalletRequest, walletKeys, walletsOptions } from '@/api/wallets'
import type { Wallets } from '@/api/types'
import { useUser } from '@/session/store'

export function useWallets() {
  const user = useUser()
  // Private routes guarantee a user; the id keeps the cache per user.
  return useQuery({ ...walletsOptions(user?.id ?? ''), enabled: !!user })
}

export function useSaveWallet(slot: keyof Wallets) {
  const queryClient = useQueryClient()
  const user = useUser()
  return useMutation({
    mutationFn: (input: Parameters<typeof saveWalletRequest>[1]) => saveWalletRequest(slot, input),
    onSuccess: (wallet) => {
      if (!user) return
      queryClient.setQueryData<Wallets>(walletKeys.all(user.id), (old) => ({ primary: null, secondary: null, ...old, [slot]: wallet }))
    },
  })
}
