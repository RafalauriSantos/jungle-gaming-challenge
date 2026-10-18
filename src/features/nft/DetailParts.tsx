import { Star } from 'lucide-react'
import type { Nft } from '@/api/types'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import type { Buy } from './useBuy'

/** Five stars, as many filled as the rounded average. */
export function Stars({ rating }: { rating: number }) {
  return (
    <span aria-hidden className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('size-[15px]', n <= Math.round(rating) ? 'fill-text-accent text-text-accent' : 'text-text-accent')} />
      ))}
    </span>
  )
}

/** The editions as pills: the chosen one in the accent color, plus the status of that edition. */
export function EditionPills({ nft, buy }: { nft: Nft; buy: Buy }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-[15px] font-bold leading-4">Edição:</legend>
      <RadioGroup value={buy.editionId} onValueChange={(v) => buy.chooseEdition(v as string)} className="flex w-auto flex-wrap items-center gap-2" aria-label="Edição">
        {nft.editions.map((e) => (
          <RadioGroupItem
            key={e.id}
            value={e.id}
            aria-label={`Edição ${e.tier}${e.status === 'sold_out' ? ', esgotada' : ''}`}
            className={cn(
              'h-7 w-auto min-w-12 shrink-0 justify-center rounded-full border-border px-3 text-sm text-text-secondary data-checked:border-primary data-checked:!bg-transparent data-checked:font-medium data-checked:!text-text-accent',
              e.status === 'sold_out' && 'line-through',
            )}
          >
            {e.tier}
          </RadioGroupItem>
        ))}
        <span className="flex h-7 items-center rounded-full border border-border px-3 text-sm text-text-secondary">{buy.edition.status === 'open' ? 'ABERTA' : 'ESGOTADA'}</span>
      </RadioGroup>
      <p className="text-xs text-text-secondary">{buy.soldOut ? 'Esta edição está esgotada.' : `Restam ${buy.edition.available} de ${buy.edition.supply}.`}</p>
    </fieldset>
  )
}

/** The result of the last "add to cart", with the way out of a network conflict. */
export function BuyMessage({ buy }: { buy: Buy }) {
  const { message } = buy
  return (
    <div aria-live="polite" className="min-h-5 text-sm">
      {message?.kind === 'ok' && <p role="status" className="text-text-accent">{message.text}</p>}
      {message?.kind === 'error' && (
        <div role="alert" className="flex flex-col items-start gap-2 text-destructive">
          <p>{message.text}</p>
          {message.offerClear && (
            <Button type="button" variant="outline" size="sm" onClick={buy.emptyThenAdd}>
              Esvaziar carrinho e adicionar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function PriceWas({ nft }: { nft: Nft }) {
  return nft.previousPrice ? (
    <s className="text-sm font-normal text-tone">
      <span className="sr-only">Preço anterior </span>
      {formatEth(nft.previousPrice)}
    </s>
  ) : null
}
