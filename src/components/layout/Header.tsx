import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown, LogIn, Search, ShoppingCart, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useLogoutAndLeave } from '@/features/auth/useAuth'
import { useCart } from '@/features/cart/useCart'
import { cn } from '@/lib/utils'
import { useUser } from '@/session/store'
import { SearchBox } from './SearchBox'

// The Figma marks "Mercado" on detail, cart, payment and confirmation, and "Início" everywhere else. The divider
// under the header belongs to the "Início" group only.
const isMarket = (path: string) => path.startsWith('/nfts/') || path.startsWith('/pedido/') || path === '/carrinho' || path === '/pagamento'

const NAV_ITEM = 'relative flex h-[45px] items-start text-base after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-transparent'
const ACTIVE = 'font-bold text-text-accent after:bg-text-accent'

/** A page that is not part of this delivery: the click gets a visible answer instead of nothing. */
function SoonItem({ label }: { label: string }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!shown) return
    const id = window.setTimeout(() => setShown(false), 2500)
    return () => window.clearTimeout(id)
  }, [shown])
  return (
    <span className="relative">
      <button type="button" onClick={() => setShown(true)} className={NAV_ITEM}>
        {label}
      </button>
      {shown && (
        <span role="status" className="absolute left-1/2 top-[34px] -translate-x-1/2 whitespace-nowrap rounded-md bg-surface-card px-2 py-1 text-xs text-text-accent shadow-lg">
          Em breve
        </span>
      )}
    </span>
  )
}

function AccountMenu({ username }: { username: string }) {
  const leave = useLogoutAndLeave()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className="h-[35px] gap-1 rounded-md font-medium" aria-label={`Conta de ${username}`} />}>
        <User aria-hidden className="size-5" />
        {username}
        <ChevronDown aria-hidden className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link to="/perfil" />}>Perfil</DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/carteiras" />}>Carteiras</DropdownMenuItem>
        <DropdownMenuItem onClick={leave}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The frame draws only the icon; the field it opens is not drawn, so it reuses the card style of the other inputs. */
function HeaderSearch({ hasQuery }: { hasQuery: boolean }) {
  const [open, setOpen] = useState(hasQuery)
  return (
    <div className="flex items-center gap-3" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      {open && <SearchBox autoFocus className="w-56 !rounded-md" placeholder="Buscar" />}
      <button type="button" aria-label="Abrir busca" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="grid size-5 place-items-center">
        <Search aria-hidden className="size-5" strokeWidth={2} />
      </button>
    </div>
  )
}

function CartLink() {
  const user = useUser()
  const { data } = useCart()
  const count = user ? (data?.items.reduce((n, i) => n + i.quantity, 0) ?? 0) : 0
  return (
    <Link to="/carrinho" aria-label={`Carrinho, ${count} itens`} className="relative">
      <ShoppingCart aria-hidden className="size-6" />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-text-accent text-[10px] font-medium text-ink">{count}</span>
      )}
    </Link>
  )
}

export function Header() {
  const user = useUser()
  const { path, hasQuery } = useRouterState({ select: (s) => ({ path: s.location.pathname, hasQuery: !!(s.location.search as { q?: string }).q }) })
  const market = isMarket(path)
  return (
    <header className={cn('mx-auto hidden w-full max-w-[1232px] px-4 md:block', !market && 'border-b border-border')}>
      <div className="flex items-start justify-between gap-6 pt-6">
        <Link to="/" className="mt-2 w-40 text-sm font-bold tracking-[1.4px]">
          KURIO
        </Link>
        <nav aria-label="Principal" className="flex items-start gap-10">
          <Link to="/" activeOptions={{ exact: true }} className={cn(NAV_ITEM, !market && ACTIVE)}>
            Início
          </Link>
          {/* The market is the catalog. Creators and learning pages are out of scope: they answer the click with "Em breve". */}
          <Link to="/" className={cn(NAV_ITEM, market && ACTIVE)}>
            Mercado
          </Link>
          <SoonItem label="Criadores" />
          <SoonItem label="Aprenda" />
        </nav>
        <div className="flex h-[35px] items-center gap-7">
          <HeaderSearch hasQuery={hasQuery} />
          <CartLink />
          {user ? (
            <AccountMenu username={user.username} />
          ) : (
            <Link to="/entrar" className="inline-flex h-[35px] w-[100px] items-center justify-center gap-1 rounded-md bg-primary font-medium text-ink">
              <LogIn aria-hidden className="size-5" />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
