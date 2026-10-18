import { useState } from 'react'
import { errorBodyOf } from '@/api/client'
import { Button } from '@/components/ui/button'
import { announce } from '@/lib/announce'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { CartDesktop } from './CartDesktop'
import { CartMobile } from './CartMobile'
import type { CartModel } from './cartModel'
import { useQuoteNotice } from './quoteNotice'
import { useCoupon } from './useCoupon'
import { useCart, useQuote, useRemoveItem, useSetQuantity } from './useCart'

export function CartPage() {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const cart = useCart()
  const [coupon, setCoupon] = useCoupon()
  const quote = useQuote(cart.data?.version, coupon)
  const setQuantity = useSetQuantity()
  const remove = useRemoveItem()
  const [error, setError] = useState<string>()
  const notice = useQuoteNotice(quote.data)

  const act = (run: Promise<unknown>) => {
    setError(undefined)
    run.catch((e) => {
      const body = errorBodyOf(e)
      const available = (body?.details as { available?: number } | undefined)?.available
      setError(body?.code === 'availability_conflict' ? `Quantidade acima do estoque. Restam ${available}.` : (body?.message ?? 'Não foi possível atualizar o carrinho.'))
    })
  }

  if (cart.isError) {
    return (
      <main className="mx-auto flex max-w-[1232px] flex-col items-start gap-3 px-4 py-12">
        <p role="alert">Não foi possível carregar seu carrinho.</p>
        <Button onClick={() => cart.refetch()}>Tentar novamente</Button>
      </main>
    )
  }

  const model: CartModel = {
    quote: quote.data,
    updating: quote.isFetching,
    loading: quote.isPending || cart.isPending,
    loadFailed: quote.isError,
    retryQuote: () => void quote.refetch(),
    coupon,
    applyCoupon: setCoupon,
    removeCoupon: () => setCoupon(''),
    notice: notice ?? undefined,
    error,
    busy: setQuantity.isPending || remove.isPending,
    setQuantity: (line, q) => act(setQuantity.mutateAsync({ nftId: line.nftId, editionId: line.editionId, quantity: q }).then(() => announce(`Quantidade de ${line.name}: ${q}.`))),
    remove: (line) => act(remove.mutateAsync({ nftId: line.nftId, editionId: line.editionId }).then(() => announce(`${line.name} removido do carrinho.`))),
  }
  const empty = !!cart.data && cart.data.items.length === 0
  return desktop ? <CartDesktop m={model} empty={empty} /> : <CartMobile m={model} empty={empty} />
}
