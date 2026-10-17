import { Link } from '@tanstack/react-router'
import { Download, Heart, LogOut, MapPin, ShoppingCart, Tag, TriangleAlert, User, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLogoutAndLeave } from '@/features/auth/useAuth'

const ITEM = 'flex items-center gap-3 px-4 text-[15px] leading-[45px] text-text-accent'

// Pages other than profile and wallets are outside the required flows: listed as in the Figma, inert.
const INERT: [string, LucideIcon][] = [
  ['Atividade', ShoppingCart],
  ['Lista de interesse', Heart],
  ['Ofertas', Tag],
  ['Arquivos baixados', Download],
  ['Suporte', TriangleAlert],
]

/** The "Meu perfil" frame: a side menu and the content of the section. */
export function AccountShell({ children }: { children: ReactNode }) {
  const leave = useLogoutAndLeave()
  return (
    <main className="mx-auto grid w-full max-w-[1232px] gap-8 px-4 py-6 md:grid-cols-[310px_1fr] md:gap-7 md:pt-8">
      <nav aria-label="Minha conta" className="self-start bg-surface-card py-2">
        <p className="p-2.5 text-lg font-bold leading-4">Meu perfil</p>
        <ul>
          {[
            ['/perfil', 'Dados do perfil', User],
            ['/carteiras', 'Carteiras', MapPin],
          ].map(([to, label, Icon]) => (
            <li key={to as string}>
              <Link to={to as '/perfil' | '/carteiras'} className={`${ITEM} border-l-[6px] border-transparent [&.active]:border-primary`}>
                {(() => {
                  const I = Icon as LucideIcon
                  return <I aria-hidden className="size-4" />
                })()}
                {label as string}
              </Link>
            </li>
          ))}
          {INERT.map(([label, Icon]) => (
            <li key={label} className={`${ITEM} border-l-[6px] border-transparent opacity-70`} aria-disabled="true" title="Em breve">
              <Icon aria-hidden className="size-4" />
              {label}
            </li>
          ))}
        </ul>
        <button type="button" onClick={leave} className="flex h-10 w-full items-center gap-2 border-l-[6px] border-t border-transparent border-t-border px-4 text-[15px] font-bold leading-[15px] text-text-accent">
          <LogOut aria-hidden className="size-4" />
          Sair
        </button>
      </nav>
      <div>{children}</div>
    </main>
  )
}
