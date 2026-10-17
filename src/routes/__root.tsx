import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MobileTabBar } from '@/components/layout/MobileTabBar'

export const Route = createRootRoute({
  component: () => (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:p-2 focus:text-ink">
        Ir para o conteúdo
      </a>
      <Header />
      <div id="conteudo" className="pt-4 md:pt-0">
        <Outlet />
      </div>
      <Footer />
      <MobileTabBar />
    </>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-[1200px] px-4 py-16">
      <h1 className="mb-4 text-2xl font-bold">Página não encontrada</h1>
      <Link to="/" className="text-text-accent underline">Voltar ao início</Link>
    </main>
  ),
})
