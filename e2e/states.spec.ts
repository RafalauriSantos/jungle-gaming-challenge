import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

// API-5: loading, error with retry, empty and success on each screen that reads server data.
// Background refresh is a checklist entry in docs/spec/design-decisions.md (queries do not refetch on focus).
const SCREENS = [
  { name: 'favorites', path: '/favoritos', loading: 'Carregando favoritos', error: 'Não foi possível carregar seus favoritos.', ready: /^Favoritos$/ },
  { name: 'wallets', path: '/carteiras', loading: 'Carregando carteiras', error: 'Não foi possível carregar suas carteiras.', ready: /Carteira principal/ },
  { name: 'profile', path: '/perfil', loading: 'Carregando perfil', error: 'Não foi possível carregar seu perfil.', ready: /Perfil do colecionador/ },
  { name: 'detail', path: '/nfts/nft-004', loading: 'Carregando NFT', error: 'Não foi possível carregar este NFT.', ready: /Cosmic Bloom|#412/ },
  { name: 'order', path: '/pedido/ord-inexistente', loading: 'Carregando pedido', error: 'Não foi possível carregar o pedido', ready: /Pedido não encontrado/ },
] as const

const mock = async (page: Page, expr: string) => {
  await page.waitForFunction('!!window.__mock')
  await page.evaluate(`window.__mock.${expr}`)
}

for (const s of SCREENS) {
  test(`API-5#1 API-5#1: ${s.name} shows a loading state, then its content`, async ({ page }) => {
    await signIn(page)
    await page.goto(`${s.path}?scenario=slow`)
    await expect(page.getByRole('status', { name: s.loading }).or(page.getByLabel(s.loading)).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: s.ready }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('status', { name: s.loading })).toHaveCount(0)
  })

  test(`API-5#1: ${s.name} says it failed and recovers on retry`, async ({ page }) => {
    await signIn(page)
    await page.goto(`${s.path}?scenario=http-4xx`)
    await expect(page.getByText(s.error).first()).toBeVisible()
    await mock(page, "setScenario('success')")
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText(s.error)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: s.ready }).first()).toBeVisible()
  })
}

test('API-5#1: the cart, the payment and the favorites say when they are empty', async ({ page }) => {
  await signIn(page)
  await page.goto('/favoritos')
  await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  await page.goto('/pagamento')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('API-5#1: the cart and the payment say they failed and recover on retry', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: /comprar/i }).first().click()
  await expect(page).toHaveURL('/carrinho')
  for (const [path, error, ready] of [
    ['/carrinho', 'Não foi possível carregar seu carrinho.', /^Carrinho( de NFTs)?$/],
    ['/pagamento', 'Não foi possível carregar o pagamento.', /Pagamento|Revise|Carteira/],
  ] as const) {
    await page.goto(`${path}?scenario=http-4xx`)
    await expect(page.getByText(error).first()).toBeVisible()
    await mock(page, "setScenario('success')")
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText(error)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: ready }).first()).toBeVisible()
  }
})
