import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

function Promo({ image, title, text, search, flip }: {
  image: string
  title: string
  text: string
  search: { feed: 'new' } | { collection: ['digital-art'] }
  flip?: boolean
}) {
  return (
    <section className="relative flex h-[250px] items-center overflow-hidden rounded-lg bg-surface-card">
      <img src={image} alt="" aria-hidden width={292} height={250} loading="lazy"
        className={`h-full w-[292px] rounded-[18px] object-cover ${flip ? 'order-last' : ''}`} />
      <div className="relative ml-auto flex flex-col items-end gap-3 px-6 text-right">
        <h2 className="text-lg font-bold leading-6">{title}</h2>
        <p className="max-w-[263px] text-sm leading-6 text-text-secondary">{text}</p>
        <Link to="/" search={search} hash="catalogo"
          className="mt-2 inline-flex h-10 w-[140px] items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-ink">
          Explorar <ArrowRight aria-hidden className="size-[18px]" />
        </Link>
      </div>
    </section>
  )
}

export function Promos() {
  return (
    <div className="hidden gap-6 lg:grid lg:grid-cols-2">
      <Promo image="/nfts/art-1.webp" title="Lançamentos gênesis de edição limitada"
        text="Colecione edições escassas diretamente dos criadores antes da revelação pública."
        search={{ feed: 'new' }} />
      <Promo image="/nfts/art-3.webp" title="Arte digital selecionada e muito mais"
        text="Explore novos artistas, coleções verificadas e obras digitais que definem a cultura."
        search={{ collection: ['digital-art'] }} />
    </div>
  )
}
