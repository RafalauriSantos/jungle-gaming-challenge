import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MobileTabBar } from '@/components/layout/MobileTabBar'

const AUTH_PATHS = ['/entrar', '/cadastrar']

function Root() {
  // On mobile the sign-in and sign-up screens stand alone, as drawn in the Figma.
  const auth = useRouterState({ select: (s) => AUTH_PATHS.includes(s.location.pathname) })
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:p-2 focus:text-ink">
        Ir para o conteúdo
      </a>
      <Header />
      <div id="conteudo" className="pt-4 md:pt-0">
        <Outlet />
      </div>
      <div className={auth ? 'max-md:hidden' : undefined}>
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
