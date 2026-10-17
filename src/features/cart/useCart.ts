import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addItemRequest, cartKeys, cartOptions, quoteOptions, removeItemRequest, setQuantityRequest } from '@/api/cart'
import type { Cart } from '@/api/types'
import { useUser } from '@/session/store'

export function useCart() {
  const user = useUser()
  return useQuery({ ...cartOptions(user?.id ?? ''), enabled: !!user })
}

/** Every mutation answers with the whole cart, which replaces the cached one. */
function useCartMutation<V>(request: (v: V) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const user = useUser()
  return useMutation({
    mutationFn: request,
    onSuccess: (cart) => {
      if (user) queryClient.setQueryData(cartKeys.cart(user.id), cart)
    },
  })
}

export const useAddToCart = () => useCartMutation(addItemRequest)
export const useSetQuantity = () =>
  useCartMutation((v: { nftId: string; editionId: string; quantity: number }) => setQuantityRequest(v.nftId, v.editionId, v.quantity))
export const useRemoveItem = () => useCartMutation((v: { nftId: string; editionId: string }) => removeItemRequest(v.nftId, v.editionId))

/** The quote of the current cart. A new cart version or coupon is a new key, so the old answer is never reused. */
export function useQuote(cartVersion: number | undefined, coupon: string) {
  const user = useUser()
  return useQuery({ ...quoteOptions(user?.id ?? '', cartVersion ?? 0, coupon), enabled: !!user && cartVersion !== undefined && cartVersion > 0 })
}
