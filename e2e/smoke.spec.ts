import { expect, test } from '@playwright/test'
import { signIn } from './support'

// Runs locally and, with BASE_URL, against the deployed site.
// [path, heading, needs a session]. The sign-in heading is level 1 on mobile and 2 in the modal.
const ROUTES = [
  ['/', /^SEJA DONO/, false],
  ['/nfts/nft-001', /^Emerald Ape #001$/, false],
  ['/entrar', /^Entrar$/, false],
  ['/cadastrar', /^Criar (conta|perfil de colecionador)$/, false],
  ['/carrinho', /^Carrinho$/, true],
  ['/favoritos', /^Favoritos$/, true],
  ['/perfil', /^Perfil do colecionador$/, true],
  ['/carteiras', /^Carteira principal$/, true],
] as const

for (const [path, heading, private_] of ROUTES) {
  test(`ROUTE-2#1 ROUTE-2#2: ${path} opens by direct URL and survives a refresh`, async ({ page }) => {
    if (private_) await signIn(page)
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  })
}

test('ROUTE-1#1: an unknown route shows the not-found page with a way back', async ({ page }) => {
  await page.goto('/nada-aqui')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/')
})

test('MOCK-8#1: the catalog is answered by the mock service worker', async ({ page }) => {
  const response = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/nfts')
  await page.goto('/')
  expect((await response).status()).toBe(200)
  // No backend exists at the deployed origin, so the worker controlling the page is the only source.
  const worker = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? '')
  expect(worker).toMatch(/\/mockServiceWorker\.js$/)
})

test('ASSET-1#1: no request leaves the app origin', async ({ page, baseURL }) => {
  const foreign: string[] = []
  page.on('request', (r) => {
    if (!r.url().startsWith('data:') && new URL(r.url()).origin !== new URL(baseURL!).origin) foreign.push(r.url())
  })
  await page.goto('/')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await page.waitForLoadState('networkidle')
  expect(foreign).toEqual([])
})
