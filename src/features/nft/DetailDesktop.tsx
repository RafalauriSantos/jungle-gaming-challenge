import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { nftListOptions } from '@/api/nfts'
import type { Nft } from '@/api/types'
import linkedin from '@/assets/icons/share-linkedin.svg'
import mail from '@/assets/icons/share-mail.svg'
import twitter from '@/assets/icons/share-twitter.svg'
import { Button } from '@/components/ui/button'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { ProductCarousel } from '@/features/catalog/ProductCarousel'
import { formatEth } from '@/lib/domain/eth'
import { formatRating } from '@/lib/domain/nft'
import { BuyMessage, EditionPills, PriceWas, Stars } from './DetailParts'
import { Stepper } from './Stepper'
import type { Buy } from './useBuy'

function Share({ nft }: { nft: Nft }) {
  const url = typeof location === 'undefined' ? '' : location.href
  const text = `${nft.name} na Kurio`
  const links = [
    ['LinkedIn', linkedin, `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, 'size-[15px]'],
    ['E-mail', mail, `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`, 'size-[18px]'],
    ['Twitter', twitter, `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, 'h-3 w-4'],
  ] as const
  return (
    <div className="flex items-center gap-2">
      <p className="text-[15px] font-bold leading-4">Compartilhar este NFT:</p>
      {links.map(([name, icon, href, size]) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Compartilhar no ${name}`}>
          <img src={icon} alt="" className={size} />
        </a>
      ))}
    </div>
  )
}

function MoreFromCollection({ nft }: { nft: Nft }) {
  const { data } = useQuery(nftListOptions({ collection: [nft.collection] }))
  return <ProductCarousel title="Mais desta coleção" items={(data?.items ?? []).filter((n) => n.id !== nft.id)} className="mt-24" />
}

export function DetailDesktop({ nft, buy }: { nft: Nft; buy: Buy }) {
  return (
    <main className="mx-auto max-w-[1232px] px-4 pb-10 pt-8">
      <nav aria-label="Você está em" className="text-[15px] font-bold leading-4">
        <Link to="/">Início</Link> / <span>Mercado</span>
      </nav>

      <div className="mt-3 flex items-start gap-8">
        <div className="flex h-[448px] w-[573px] shrink-0 items-center gap-7">
          <div aria-hidden className="flex w-[100px] shrink-0 flex-col gap-4">
            {[0, 1, 2, 3].map((i) => (
              <img key={i} src={nft.image} alt="" width={100} height={100} className={`size-[100px] rounded-lg object-cover ${i === 1 ? 'border border-primary' : ''}`} />
            ))}
          </div>
          <div className="grid size-[444px] shrink-0 place-items-center rounded-md bg-surface-card p-4">
            <img src={nft.image} alt={`Arte do NFT ${nft.name}`} width={404} height={404} fetchPriority="high" className="size-[404px] rounded-3xl object-cover" />
          </div>
        </div>

        {/* The frame spreads these blocks over the 448 px of the image; when the text is longer than the frame's, the column
            grows instead and every block keeps at least 24 px from the next (the old layout had them touching). */}
        <section aria-labelledby="nft-title" className="flex min-h-[448px] min-w-0 flex-1 flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <h1 id="nft-title" className="text-[28px] font-bold">{nft.name}</h1>
            <div className="flex items-center justify-between">
              <p className="flex items-baseline gap-3 text-[22px] font-bold leading-4 text-text-accent">
                {formatEth(nft.price)}
                <PriceWas nft={nft} />
              </p>
              <p className="flex items-center gap-1 text-[15px]">
                <Stars rating={nft.rating} />
                <span><span className="sr-only">Nota {formatRating(nft.rating)}. </span>{nft.reviewCount} avaliações de colecionadores</span>
              </p>
            </div>
            <div className="h-px w-full bg-border" />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[15px] font-bold leading-4">Sobre este NFT:</h2>
            <p className="text-sm leading-6 text-text-secondary">{nft.about}</p>
          </div>

          <EditionPills nft={nft} buy={buy} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <Stepper variant="large" label={`Quantidade de ${nft.name}`} value={buy.quantity} max={Math.max(1, buy.edition.available)} onChange={buy.setQuantity} disabled={buy.soldOut} />
              <div className="flex items-center gap-2">
                <Button type="button" disabled={buy.soldOut || buy.adding} onClick={buy.buyNow} className="h-10 w-[130px] rounded-md text-sm font-bold">
                  COMPRAR
                </Button>
                <FavoriteButton nftId={nft.id} name={nft.name} className="h-10 w-[130px] rounded-md border-primary text-sm font-medium text-text-accent" />
              </div>
            </div>
            <BuyMessage buy={buy} />
          </div>

          <div className="flex flex-col gap-3">
            <dl className="flex flex-col gap-3 text-[15px] text-tone">
              <div><dt className="inline">ID do token:</dt> <dd className="inline">{nft.tokenId}</dd></div>
              <div><dt className="inline">Coleção:</dt> <dd className="inline">{nft.series}</dd></div>
              <div><dt className="inline">Atributos:</dt> <dd className="inline">{nft.attributes.join(', ')}</dd></div>
            </dl>
            <Share nft={nft} />
          </div>
        </section>
      </div>

      <section aria-label="Descrição do NFT" className="mt-24 flex flex-col gap-3">
        <div className="flex gap-8 border-b border-border">
          <h2 className="-mb-px w-[161px] border-b-[3px] border-primary pb-3 text-[17px] font-bold leading-4 text-text-accent">Detalhes do NFT</h2>
          <p className="text-[17px] leading-4" title="Em breve" aria-disabled="true">Avaliações de colecionadores ({nft.reviewCount})</p>
        </div>
        <div className="flex flex-col text-sm leading-6 text-text-secondary">
          {nft.description.paragraphs.map((p) => (
            <p key={p} className="mb-6">{p}</p>
          ))}
          {nft.description.sections.map((s) => (
            <div key={s.label}>
              <p className="font-bold text-foreground">{s.label}</p>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <MoreFromCollection nft={nft} />
    </main>
  )
}
