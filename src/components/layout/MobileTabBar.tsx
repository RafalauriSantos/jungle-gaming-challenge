import { Link } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingBag, User } from 'lucide-react'

const item = 'grid size-11 place-items-center rounded-full text-tone [&.active]:text-text-accent'

export function MobileTabBar() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center justify-between rounded-t-[32px] bg-surface-card px-8 md:hidden"
    >
      <Link to="/" activeOptions={{ exact: true }} aria-label="Início" className={item}>
        <Home aria-hidden />
      </Link>
      <Link to="/favoritos" aria-label="Favoritos" className={item}>
        <Heart aria-hidden />
      </Link>
      <Link
        to="/"
        search={{ feed: 'new' }}
        aria-label="Explorar lançamentos"
        className="-mt-10 grid size-16 place-items-center rounded-full bg-primary text-ink"
      >
        <ScanLine aria-hidden />
      </Link>
      <Link to="/carrinho" aria-label="Carrinho" className={item}>
        <ShoppingBag aria-hidden />
      </Link>
      <Link to="/perfil" aria-label="Perfil" className={item}>
        <User aria-hidden />
      </Link>
    </nav>
  )
}
