import { Link } from '@tanstack/react-router'
import { Search, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Nft } from '@/api/types'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { useBuy } from '@/features/nft/useBuy'
import { announce } from '@/lib/ui/announce'
import { formatEth } from '@/lib/domain/eth'
import { totalAvailable } from '@/lib/domain/nft'

const ACTION = 'grid size-9 place-items-center rounded-full border border-border bg-ink/80 text-text-accent outline-none transition-colors hover:bg-surface-raised focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

/** The three buttons the desktop frame shows on a card under the pointer: add to cart, favorite, view. */
function CardActions({ nft, soldOut }: { nft: Nft; soldOut: boolean }) {
  const buy = useBuy(nft)
  const [dismissed, setDismissed] = useState<unknown>(null)
  useEffect(() => {
    if (!buy.message) return
    announce(buy.message.text)
    // A confirmation goes away by itself; a refusal that offers a remedy stays until it is used or the cart changes.
    if (buy.message.offerClear) return
    const id = window.setTimeout(() => setDismissed(buy.message), 4000)
    return () => window.clearTimeout(id)
  }, [buy.message])
  const shown = buy.message && buy.message !== dismissed ? buy.message : null
  return (
    <>
      {/* Only where a pointer can hover: on a touch screen the invisible buttons would swallow taps meant for the card. */}
      <div className="pointer-events-none absolute inset-x-0 top-[222px] hidden justify-center gap-2 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 md:[@media(hover:hover)]:flex">
        <button type="button" disabled={soldOut || buy.adding} aria-label={`Adicionar ${nft.name} ao carrinho`} onClick={buy.addToCart} className={`${ACTION} pointer-events-auto`}>
          <ShoppingCart aria-hidden className="size-4" />
        </button>
        <FavoriteButton nftId={nft.id} name={nft.name} variant="icon" className={`${ACTION} pointer-events-auto size-9 p-0`} />
        <Link to="/nfts/$id" params={{ id: nft.id }} aria-label={`Ver ${nft.name}`} className={`${ACTION} pointer-events-auto`}>
          <Search aria-hidden className="size-4" />
        </Link>
      </div>
      {shown && (
        <div role="status" className={`absolute inset-x-3 top-[168px] hidden rounded-md border px-3 py-2 text-xs shadow-lg md:block ${shown.kind === 'error' ? 'border-destructive bg-ink text-destructive' : 'border-primary bg-ink text-text-accent'}`}>
          <p>{shown.text}</p>
          {shown.offerClear && (
            <button type="button" onClick={buy.emptyThenAdd} className="mt-1 font-bold underline">
              Esvaziar carrinho e adicionar
            </button>
          )}
        </div>
      )}
    </>
  )
}

export function NftCard({ nft }: { nft: Nft }) {
  const soldOut = totalAvailable(nft) === 0
  return (
    <li data-testid="nft-card" className="group/card relative">
      <Link to="/nfts/$id" params={{ id: nft.id }} className="group block rounded-[20px]">
        <div className="relative rounded-[20px] bg-gradient-to-br from-surface-card from-10% to-surface-raised p-1 pb-3 pt-3 md:grid md:h-[300px] md:place-items-center md:rounded-none md:bg-surface-card md:bg-none md:p-0">
          <img
            src={nft.image}
            srcSet={`${nft.image.replace('.webp', '-360.webp')} 360w, ${nft.image} 640w`}
            sizes="(min-width: 768px) 250px, 45vw"
            alt={`Arte do NFT ${nft.name}`}
            width={250}
            height={250}
            loading="lazy"
            className="aspect-square w-full rounded-2xl object-cover transition-transform group-hover:scale-[1.02] md:size-[250px] md:rounded-[15px]"
          />
          {nft.rare && (
            <span className="absolute left-0 top-4 bg-primary px-2 py-1 text-[13px] font-medium text-ink">
              RARO
            </span>
          )}
          {soldOut && (
            <span className="absolute bottom-3 left-3 rounded bg-ink/80 px-2 py-1 text-xs font-bold text-foreground md:bottom-7">
              Esgotado
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-1.5 pl-2 md:mt-3 md:gap-3 md:pl-0">
          <h2 className="text-[15px] md:text-base md:leading-4">{nft.name}</h2>
          <p className="flex items-center gap-3 text-base font-bold text-text-accent md:text-lg md:leading-4">
            {formatEth(nft.price)}
            {nft.previousPrice && (
              <s className="font-normal text-tone md:text-lg md:leading-4 md:[text-decoration:none]">
                <span className="sr-only">Preço anterior </span>
                {formatEth(nft.previousPrice)}
              </s>
            )}
          </p>
        </div>
      </Link>
      {/* The mobile frame draws a heart on the card; the desktop card shows its buttons on hover (D-16). A touch tablet has no hover, so it keeps the heart. */}
      <CardActions nft={nft} soldOut={soldOut} />
      <FavoriteButton nftId={nft.id} name={nft.name} variant="icon" className="absolute right-3 top-5 size-[35px] rounded-full border border-border bg-ink/60 text-text-accent md:[@media(hover:hover)]:hidden" />
    </li>
  )
}

/** Same box as an NFT card, so the page does not move when the cards arrive. */
export function NftCardSkeleton() {
  return (
    <li aria-hidden="true">
      <div className="rounded-[20px] bg-surface-card p-1 pb-3 pt-3 md:grid md:h-[300px] md:place-items-center md:rounded-none md:p-0">
        <div className="skeleton aspect-square w-full rounded-2xl md:size-[250px] md:rounded-[15px]" />
      </div>
      <div className="mt-2 flex flex-col gap-1.5 pl-2 md:mt-3 md:gap-3 md:pl-0">
        <div className="skeleton h-[22.5px] w-3/4 rounded md:h-4" />
        <div className="skeleton h-6 w-1/3 rounded md:h-4" />
      </div>
    </li>
  )
}
