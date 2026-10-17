import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/types'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { formatEth } from '@/lib/eth'
import { totalAvailable } from '@/lib/nft'

export function NftCard({ nft }: { nft: Nft }) {
  const soldOut = totalAvailable(nft) === 0
  return (
    <li data-testid="nft-card" className="relative">
      <Link to="/nfts/$id" params={{ id: nft.id }} className="group block rounded-[20px]">
        <div className="relative rounded-[20px] bg-gradient-to-br from-surface-card from-10% to-surface-raised p-1 pb-3 pt-3 md:pb-7 md:pt-5">
          <img
            src={nft.image}
            alt={`Arte do NFT ${nft.name}`}
            width={250}
            height={250}
            loading="lazy"
            className="aspect-square w-full rounded-2xl object-cover transition-transform group-hover:scale-[1.02]"
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
        <div className="mt-2 flex flex-col gap-1.5 pl-2 md:mt-3">
          <h2 className="text-[15px] md:text-base">{nft.name}</h2>
          <p className="flex items-center gap-3 text-base font-bold text-text-accent md:text-lg">
            {formatEth(nft.price)}
            {nft.previousPrice && (
              <s className="font-normal text-tone">
                <span className="sr-only">Preço anterior </span>
                {formatEth(nft.previousPrice)}
              </s>
            )}
          </p>
        </div>
      </Link>
      {/* The mobile frame draws a heart on the card; the desktop card has none (D-16). */}
      <FavoriteButton nftId={nft.id} name={nft.name} variant="icon" className="absolute right-3 top-5 md:hidden" />
    </li>
  )
}

/** Same box as an NFT card, so the page does not move when the cards arrive. */
export function NftCardSkeleton() {
  return (
    <li aria-hidden="true">
      <div className="rounded-[20px] bg-surface-card p-1 pb-3 pt-3 md:pb-7 md:pt-5">
        <div className="skeleton aspect-square w-full rounded-2xl" />
      </div>
      <div className="mt-2 flex flex-col gap-1.5 pl-2 md:mt-3">
        <div className="skeleton h-[22.5px] w-3/4 rounded md:h-6" />
        <div className="skeleton h-6 w-1/3 rounded md:h-7" />
      </div>
    </li>
  )
}
