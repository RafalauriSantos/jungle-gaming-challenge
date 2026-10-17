import { useRouter } from '@tanstack/react-router'
import { ArrowLeft, ShoppingBag, Star } from 'lucide-react'
import type { Nft } from '@/api/types'
import { Button } from '@/components/ui/button'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { formatEth } from '@/lib/eth'
import { formatRating } from '@/lib/nft'
import { BuyMessage, EditionPills, PriceWas } from './DetailParts'
import { Stepper } from './Stepper'
import type { Buy } from './useBuy'

export function DetailMobile({ nft, buy }: { nft: Nft; buy: Buy }) {
  const router = useRouter()
  return (
    <main className="mx-auto -mt-4 flex min-h-dvh max-w-[414px] flex-col pb-[164px]">
      <div className="relative mb-[-114px] h-[506px] shrink-0 bg-gradient-to-br from-surface-card from-[12%] to-surface-raised px-7 pt-6">
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="icon" aria-label="Voltar" onClick={() => router.history.back()} className="size-[35px] rounded-full border-border bg-surface-raised">
            <ArrowLeft aria-hidden className="size-4 text-text-accent" />
          </Button>
          <FavoriteButton nftId={nft.id} name={nft.name} variant="icon" className="size-[35px] rounded-full border border-border bg-surface-raised text-text-accent" />
        </div>
        <img src={nft.image} alt={`Arte do NFT ${nft.name}`} width={361} height={356} fetchPriority="high" className="mt-2 h-[356px] w-full rounded-3xl object-cover" />
      </div>

      <section aria-labelledby="nft-title" className="relative flex flex-col gap-3 rounded-t-[31px] bg-surface-card px-6 pb-6 pt-8">
        <div className="flex items-center justify-between">
          <h1 id="nft-title" className="text-xl font-bold leading-4">{nft.name}</h1>
          <p className="flex h-[27px] items-center gap-1.5 rounded-full border border-primary px-[6px] text-sm">
            <Star aria-hidden className="size-3.5 fill-text-accent text-text-accent" />
            <span className="font-medium"><span className="sr-only">Nota </span>{formatRating(nft.rating)}</span>
            <span className="text-text-secondary"><span className="sr-only">, </span>({nft.reviewCount})</span>
          </p>
        </div>
        <p className="text-sm leading-6 text-text-secondary">{nft.about}</p>
        <EditionPills nft={nft} buy={buy} />
        <dl className="flex flex-col gap-3 text-[15px] text-tone">
          <div><dt className="inline">ID do token:</dt> <dd className="inline">{nft.tokenId}</dd></div>
          <div><dt className="inline">Coleção:</dt> <dd className="inline">{nft.series}</dd></div>
          <div><dt className="inline">Atributos:</dt> <dd className="inline">{nft.attributes.join(', ')}</dd></div>
        </dl>
        <BuyMessage buy={buy} />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[414px] flex-col gap-5 rounded-t-[40px] bg-surface-card px-6 pb-9 pt-5 shadow-[0_0_10px_rgba(10,6,4,0.45)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-text-secondary">Qtd.</span>
            <Stepper variant="pill" label={`Quantidade de ${nft.name}`} value={buy.quantity} max={Math.max(1, buy.edition.available)} onChange={buy.setQuantity} disabled={buy.soldOut} />
          </div>
          <p className="flex items-baseline gap-2 text-xl font-bold leading-4 text-text-accent">
            {formatEth(nft.price)}
            <PriceWas nft={nft} />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={buy.soldOut || buy.adding}
            onClick={buy.buyNow}
            className="h-[60px] w-[196px] rounded-[40px] bg-gradient-to-br from-primary from-[4%] to-primary/80 text-base font-bold text-ink disabled:opacity-50"
          >
            Comprar NFT
          </button>
          <button
            type="button"
            aria-label="Adicionar ao carrinho"
            disabled={buy.soldOut || buy.adding}
            onClick={buy.addToCart}
            className="grid size-[60px] place-items-center rounded-[40px] border border-border bg-surface-raised disabled:opacity-50"
          >
            <ShoppingBag aria-hidden className="size-5 text-text-accent" />
          </button>
        </div>
      </div>
    </main>
  )
}
