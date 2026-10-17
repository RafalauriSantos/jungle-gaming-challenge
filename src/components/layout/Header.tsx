import { Link } from '@tanstack/react-router'
import { LogIn, ShoppingCart } from 'lucide-react'
import { SearchBox } from './SearchBox'

const NAV = ['Mercado', 'Criadores', 'Aprenda']

export function Header({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="mx-auto hidden w-full max-w-[1200px] border-b border-border px-4 md:block">
      <div className="flex items-center justify-between gap-6 py-3">
        <Link to="/" className="w-40 text-sm font-bold tracking-[1.4px]">
          KURIO
        </Link>
        <nav aria-label="Principal" className="flex items-start gap-10 text-base">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="border-b-[3px] border-transparent font-bold text-foreground [&.active]:border-text-accent [&.active]:text-text-accent"
          >
            Início
          </Link>
          {/* Editorial/market pages are out of scope; shown as inert labels. */}
          {NAV.map((n) => (
            <span key={n} className="text-foreground">
              {n}
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-7">
          <SearchBox className="w-48 !rounded-md" placeholder="Buscar" />
          <Link to="/carrinho" aria-label={`Carrinho, ${cartCount} itens`} className="relative">
            <ShoppingCart aria-hidden className="size-6" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-text-accent text-[10px] font-medium text-ink">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            to="/entrar"
            className="inline-flex h-[35px] w-[100px] items-center justify-center gap-1 rounded-md bg-primary font-medium text-ink"
          >
            <LogIn aria-hidden className="size-5" />
            Entrar
          </Link>
        </div>
      </div>
    </header>
  )
}
