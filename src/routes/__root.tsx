import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MobileTabBar } from '@/components/layout/MobileTabBar'

// Screens the Figma draws on mobile without the tab bar or the footer.
const STANDALONE_ON_MOBILE = ['/entrar', '/cadastrar', '/carrinho', '/pagamento', '/pedido']
const standalone = (path: string) => path.startsWith('/nfts/') || STANDALONE_ON_MOBILE.some((p) => path === p || path.startsWith(`${p}/`))

function Root() {
  const alone = useRouterState({ select: (s) => standalone(s.location.pathname) })
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:p-2 focus:text-ink">
        Ir para o conteúdo
      </a>
      <Header />
      <div id="conteudo" className="pt-4 md:pt-0">
        <Outlet />
      </div>
      <div className={alone ? 'max-md:hidden' : undefined}>
        <Footer />
        <MobileTabBar />
      </div>
    </>
  )
}

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: () => (
    <main className="mx-auto max-w-[1200px] px-4 py-16">
      <h1 className="mb-4 text-2xl font-bold">Página não encontrada</h1>
      <Link to="/" className="text-text-accent underline">Voltar ao início</Link>
    </main>
  ),
})
