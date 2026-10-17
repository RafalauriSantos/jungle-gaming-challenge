import { useQuery } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { errorBodyOf } from '@/api/client'
import { nftDetailOptions, nftListOptions } from '@/api/nfts'
import type { Nft } from '@/api/types'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { useAddToCart, useCart, useRemoveItem } from '@/features/cart/useCart'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { addVisitorItem } from '@/features/cart/visitorCart'
import { COLLECTION_LABELS, NETWORK_LABELS } from '@/features/catalog/search'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { useUser } from '@/session/store'
import { Stepper } from './Stepper'

function DetailSkeleton() {
  return (
    <div aria-busy="true" role="status" aria-label="Carregando NFT" className="mx-auto grid max-w-[1200px] gap-8 px-4 py-6 md:grid-cols-[110px_450px_1fr]">
      <Skeleton className="hidden h-[450px] md:block" />
      <Skeleton className="aspect-square w-full md:h-[450px]" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </div>
  )
}

function Missing() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-16">
      <h1 className="mb-4 text-2xl font-bold">NFT não encontrado</h1>
      <p className="mb-4 text-text-secondary">Ele pode ter sido removido ou o endereço está incorreto.</p>
      <Link to="/" className="text-text-accent underline">Voltar ao catálogo</Link>
    </main>
  )
}

function Buy({ nft }: { nft: Nft }) {
  const router = useRouter()
  const user = useUser()
  const cart = useCart()
  const add = useAddToCart()
  const clear = useRemoveItem()
  const first = nft.editions.find((e) => e.status === 'open') ?? nft.editions[0]!
  const [editionId, setEditionId] = useState(first.id)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string; offerClear?: boolean } | null>(null)
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

  return (
    <>
      <fieldset className="mt-3">
        <legend className="mb-2 text-sm font-bold">Edição:</legend>
        <RadioGroup
          value={editionId}
          onValueChange={(v) => {
            setEditionId(v as string)
            setQuantity(1)
          }}
          className="flex w-auto flex-wrap items-center gap-2"
          aria-label="Edição"
        >
          {nft.editions.map((e) => (
            <RadioGroupItem
              key={e.id}
              value={e.id}
              aria-label={`Edição ${e.tier}${e.status === 'sold_out' ? ', esgotada' : ''}`}
              className={cn('h-7 w-auto min-w-12 shrink-0 rounded-full border-border px-3 text-xs data-checked:border-primary data-checked:!bg-transparent data-checked:!text-foreground', e.status === 'sold_out' && 'line-through')}
            >
              {e.tier}
            </RadioGroupItem>
          ))}
          <span className="rounded-full border border-border px-3 py-1 text-xs">{edition.status === 'open' ? 'ABERTA' : 'ESGOTADA'}</span>
        </RadioGroup>
        <p className="mt-2 text-xs text-text-secondary">
          {soldOut ? 'Esta edição está esgotada.' : `Restam ${edition.available} de ${edition.supply}.`}
        </p>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Stepper label={`Quantidade de ${nft.name}`} value={quantity} max={Math.max(1, edition.available)} onChange={setQuantity} disabled={soldOut} />
        <Button type="button" disabled={soldOut || add.isPending} onClick={() => void addToCart(true)} className="h-9 rounded-md px-6 font-bold">
          COMPRAR
        </Button>
        <FavoriteButton nftId={nft.id} name={nft.name} />
        <Button type="button" variant="outline" size="icon" aria-label="Adicionar ao carrinho" disabled={soldOut || add.isPending} onClick={() => void addToCart(false)} className="md:hidden">
          <ShoppingCart aria-hidden />
        </Button>
      </div>
      <div aria-live="polite" className="mt-2 min-h-5 text-sm">
        {message?.kind === 'ok' && <p role="status" className="text-text-accent">{message.text}</p>}
        {message?.kind === 'error' && (
          <div role="alert" className="flex flex-col items-start gap-2 text-destructive">
            <p>{message.text}</p>
            {message.offerClear && (
              <Button type="button" variant="outline" size="sm" onClick={() => void emptyThenAdd()}>
                Esvaziar carrinho e adicionar
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function MoreFromCollection({ nft }: { nft: Nft }) {
  const { data } = useQuery(nftListOptions({ collection: [nft.collection] }))
  const items = (data?.items ?? []).filter((n) => n.id !== nft.id).slice(0, 5)
  if (!items.length) return null
  return (
    <section aria-labelledby="more" className="mt-16">
      <h2 id="more" className="border-b border-border pb-2 text-sm font-bold text-text-accent">Mais desta coleção</h2>
      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {items.map((n) => (
          <li key={n.id}>
            <Link to="/nfts/$id" params={{ id: n.id }} className="block rounded-lg bg-surface-card p-2">
              <img src={n.image} alt="" width={160} height={160} loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />
              <p className="mt-2 text-sm">{n.name}</p>
              <p className="text-sm font-bold text-text-accent">{formatEth(n.price)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function NftDetail({ id }: { id: string }) {
  const router = useRouter()
  const { data: nft, isPending, isError, error, refetch } = useQuery(nftDetailOptions(id))

  if (isPending) return <DetailSkeleton />
  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) return <Missing />
    return (
      <main className="mx-auto flex max-w-[1200px] flex-col items-start gap-3 px-4 py-16">
        <p role="alert">Não foi possível carregar este NFT.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </main>
    )
  }

  const collection = COLLECTION_LABELS[nft.collection]
  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-4 md:pb-8">
      <nav aria-label="Você está em" className="mb-4 hidden text-xs md:block">
        <Link to="/">Início</Link> / <span>Mercado</span>
      </nav>
      <div className="md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <Button type="button" variant="outline" size="icon" aria-label="Voltar" onClick={() => router.history.back()} className="rounded-full">
            <ArrowLeft aria-hidden />
          </Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-[110px_450px_1fr] md:gap-8">
        <div aria-hidden className="hidden flex-col gap-3 md:flex">
          {[0, 1, 2, 3].map((i) => (
            <img key={i} src={nft.image} alt="" width={110} height={110} className="aspect-square rounded-md object-cover" />
          ))}
        </div>
        <img src={nft.image} alt={`Arte do NFT ${nft.name}`} width={450} height={450} fetchPriority="high" className="aspect-square w-full rounded-3xl bg-surface-card object-cover md:size-[450px]" />

        <section aria-labelledby="nft-title">
          <h1 id="nft-title" className="text-2xl font-bold">{nft.name}</h1>
          <p className="mt-1 flex items-baseline gap-3 text-xl font-bold text-text-accent">
            {formatEth(nft.price)}
            {nft.previousPrice && (
              <s className="text-sm font-normal text-tone">
                <span className="sr-only">Preço anterior </span>
                {formatEth(nft.previousPrice)}
              </s>
            )}
          </p>
          <h2 className="mt-4 text-sm font-bold">Sobre este NFT:</h2>
          <p className="text-sm leading-6 text-text-secondary">
            Um colecionável digital finalizado à mão da coleção {collection}, verificado na {NETWORK_LABELS[nft.network]}, com arte desbloqueável e acesso para colecionadores.
          </p>
          <Buy key={nft.id} nft={nft} />
          <dl className="mt-6 space-y-2 text-sm text-text-secondary">
            <div className="flex gap-2"><dt>ID do token:</dt><dd>{nft.tokenId}</dd></div>
            <div className="flex gap-2"><dt>Coleção:</dt><dd>{collection}</dd></div>
            <div className="flex gap-2"><dt>Criador:</dt><dd>{nft.creator}</dd></div>
            <div className="flex gap-2"><dt>Rede:</dt><dd>{NETWORK_LABELS[nft.network]}</dd></div>
          </dl>
        </section>
      </div>
      <MoreFromCollection nft={nft} />
    </main>
  )
}
