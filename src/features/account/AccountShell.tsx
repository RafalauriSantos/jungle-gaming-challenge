import { Link } from '@tanstack/react-router'
import { Download, Heart, LogOut, MapPin, ShoppingCart, Tag, TriangleAlert, User, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLogoutAndLeave } from '@/features/auth/useAuth'

const ITEM = 'flex items-center gap-3 px-4 py-2.5 text-sm text-text-accent'

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
    <main className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-6 md:grid-cols-[220px_1fr]">
      <nav aria-label="Minha conta" className="self-start bg-surface-card">
        <p className="px-4 py-3 text-lg font-bold">Meu perfil</p>
        <ul>
          {[
            ['/perfil', 'Dados do perfil', User],
            ['/carteiras', 'Carteiras', MapPin],
          ].map(([to, label, Icon]) => (
            <li key={to as string}>
              <Link to={to as '/perfil' | '/carteiras'} className={`${ITEM} border-l-4 border-transparent [&.active]:border-primary [&.active]:bg-surface-raised`}>
                {(() => {
                  const I = Icon as LucideIcon
                  return <I aria-hidden className="size-4" />
                })()}
                {label as string}
              </Link>
            </li>
          ))}
          {INERT.map(([label, Icon]) => (
            <li key={label} className={`${ITEM} opacity-60`} aria-disabled="true" title="Em breve">
              <Icon aria-hidden className="size-4" />
              {label}
            </li>
          ))}
        </ul>
        <button type="button" onClick={leave} className={`${ITEM} w-full border-t-2 border-primary font-bold`}>
          <LogOut aria-hidden className="size-4" />
          Sair
        </button>
      </nav>
      <div>{children}</div>
    </main>
  )
}
