import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { errorBodyOf } from '@/api/client'
import type { Nft } from '@/api/types'
import { useAddToCart, useCart, useRemoveItem } from '@/features/cart/useCart'
import { addVisitorItem } from '@/features/cart/visitorCart'
import { useUser } from '@/session/store'

export type BuyMessage = { kind: 'ok' | 'error'; text: string; offerClear?: boolean }

/** The choices on the detail screen (edition, quantity) and what buying does. Both layouts draw it. */
export function useBuy(nft: Nft) {
  const router = useRouter()
  const user = useUser()
  const cart = useCart()
  const add = useAddToCart()
  const clear = useRemoveItem()
  const first = nft.editions.find((e) => e.status === 'open') ?? nft.editions[0]!
  const [editionId, setEditionIdState] = useState(first.id)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<BuyMessage | null>(null)
  const edition = nft.editions.find((e) => e.id === editionId)!
  const soldOut = edition.available === 0

  async function addToCart(goToCart: boolean) {
    if (!user) {
      // A visitor keeps the item in this browser; the first sign-in hands it to the account.
      addVisitorItem({ nftId: nft.id, editionId, quantity })
      if (goToCart) await router.navigate({ to: '/entrar', search: { redirect: '/carrinho' } })
      else setMessage({ kind: 'ok', text: 'Adicionado ao carrinho. Entre para finalizar a compra.' })
      return
    }
    setMessage(null)
    try {
      await add.mutateAsync({ nftId: nft.id, editionId, quantity })
      if (goToCart) await router.navigate({ to: '/carrinho' })
      else setMessage({ kind: 'ok', text: 'Adicionado ao carrinho.' })
    } catch (error) {
      const body = errorBodyOf(error)
      if (body?.code === 'network_mismatch') {
        setMessage({ kind: 'error', text: 'Seu carrinho tem NFTs de outra rede. Finalize a compra ou esvazie o carrinho para adicionar este.', offerClear: true })
      } else if (body?.code === 'availability_conflict') {
        const available = (body.details as { available: number }).available
        setMessage({ kind: 'error', text: `Quantidade acima do estoque. Restam ${available} desta edição.` })
      } else setMessage({ kind: 'error', text: body?.message ?? 'Não foi possível adicionar ao carrinho. Tente novamente.' })
    }
  }

  async function emptyThenAdd() {
    for (const item of cart.data?.items ?? []) await clear.mutateAsync({ nftId: item.nftId, editionId: item.editionId })
    await addToCart(false)
  }

  return {
    edition,
    editionId,
    chooseEdition: (id: string) => {
      setEditionIdState(id)
      setQuantity(1)
    },
    quantity,
    setQuantity,
    soldOut,
    adding: add.isPending,
    message,
    buyNow: () => void addToCart(true),
    addToCart: () => void addToCart(false),
    emptyThenAdd: () => void emptyThenAdd(),
  }
}

export type Buy = ReturnType<typeof useBuy>
