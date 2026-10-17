import { Link } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingBag, User } from 'lucide-react'

const item = 'grid size-11 place-items-center rounded-full text-tone [&.active]:text-text-accent'

// The bar of the frame: a card with a round notch in the middle for the raised button.
const BAR = 'M282.85 0C269.09 0 256.87 8.2 251.02 20.65C243.26 37.17 226.46 48.62 207 48.62C187.54 48.62 170.74 37.18 162.98 20.65C157.13 8.2 144.9 0 131.15 0H28.93C12.95 0 0 12.95 0 28.93V94.95H414V28.93C414 12.95 401.05 0 385.07 0H282.85Z'

export function MobileTabBar() {
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 mx-auto h-[95px] max-w-[414px] md:hidden">
      <svg aria-hidden viewBox="0 0 414 95" preserveAspectRatio="none" className="absolute inset-0 size-full drop-shadow-[0_-10px_15px_rgba(10,6,4,0.45)]">
        <path d={BAR} className="fill-surface-card" />
      </svg>
      <div className="relative flex items-start justify-between px-6 pt-[28px]">
        <Link to="/" activeOptions={{ exact: true }} aria-label="Início" className={item}>
          <Home aria-hidden className="fill-current" />
        </Link>
        <Link to="/favoritos" aria-label="Favoritos" className={item}>
          <Heart aria-hidden className="fill-current" />
        </Link>
        <span aria-hidden className="size-11" />
        <Link to="/carrinho" aria-label="Carrinho" className={item}>
          <ShoppingBag aria-hidden />
        </Link>
        <Link to="/perfil" aria-label="Perfil" className={item}>
          <User aria-hidden className="fill-current" />
        </Link>
      </div>
      <Link
        to="/"
        search={{ feed: 'new' }}
        aria-label="Explorar lançamentos"
        className="absolute left-1/2 -top-8 grid size-[65px] -translate-x-1/2 place-items-center rounded-full bg-gradient-to-b from-primary/40 to-primary text-ink"
      >
        <ScanLine aria-hidden />
      </Link>
    </nav>
  )
}
