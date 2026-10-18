import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { Nft } from '@/api/types'
import { formatEth } from '@/lib/domain/eth'
import { useMediaQuery } from '@/lib/ui/useMediaQuery'
import { cn } from '@/lib/utils'

/** A titled row of NFT cards, five at a time (four below 1280 px, where five of 219 px no longer fit); the dots are the pages. */
export function ProductCarousel({ title, items, className }: { title: string; items: Nft[]; className?: string }) {
  const [requested, setPage] = useState(0)
  const perPage = useMediaQuery('(min-width: 1280px)') ? 5 : 4
  const pages = Math.ceil(items.length / perPage)
  if (items.length === 0) return null
  const page = Math.min(requested, pages - 1)
  const shown = items.slice(page * perPage, page * perPage + perPage)
  return (
    <section aria-label={title} className={cn('flex flex-col items-center gap-8', className)}>
      <div className="flex w-full flex-col gap-3">
        <h2 className="text-[17px] font-bold leading-4 text-text-accent">{title}</h2>
        <div className="h-px w-full bg-border" />
      </div>
      <ul className="flex w-full justify-between">
        {shown.map((n) => (
          <li key={n.id}>
            <Link to="/nfts/$id" params={{ id: n.id }} className="flex flex-col gap-2">
              <span className="grid h-[255px] w-[219px] place-items-center bg-surface-card">
                <img src={n.image} alt={`Arte do NFT ${n.name}`} width={190} height={243} loading="lazy" className="h-[243px] w-[190px] rounded-[15px] object-cover" />
              </span>
              <span className="text-[15px]">{n.name}</span>
              <span className="text-base font-bold leading-4 text-text-accent">{formatEth(n.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div role="group" aria-label={`Páginas: ${title}`} className="flex items-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${title}, página ${i + 1} de ${pages}`}
              aria-current={i === page ? 'true' : undefined}
              onClick={() => setPage(i)}
              className={cn('size-3 rounded-full border border-primary', i === page && 'bg-primary')}
            />
          ))}
        </div>
      )}
    </section>
  )
}
